/**
 * PDF Search API module - Search functionality for PDFs
 */

import { invoke } from '@tauri-apps/api/core';
import type { ProcessPdfResult } from './types/pdf';

// SearchMatch type matching Rust struct
export interface SearchMatch {
    page_number: number;
    line_number: number;
    context: string;
    match_text: string;
    start_pos: number;
    end_pos: number;
    context_start_line: number; // Line number where context starts
}

// SearchOptions type matching Rust struct
export interface SearchOptions {
    caseSensitive: boolean;
    wholeWords: boolean;
}

// Cache for PDF text content
const pdfTextCache = new Map<string, ProcessPdfResult>();

/**
 * Extract text from PDF.js textContent while preserving line breaks
 * Uses hasEOL flag and Y-coordinate grouping to detect line boundaries
 */
function extractTextWithLineBreaks(textContent: any): string {
    const items = textContent.items;
    if (!items || items.length === 0) {
        return '';
    }

    const lines: string[] = [];
    let currentLine: string[] = [];
    let lastY: number | null = null;
    const Y_TOLERANCE = 2; // Tolerance for Y-coordinate grouping (in PDF units)

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const text = item.str || '';
        
        // Skip empty items
        if (text.trim() === '') {
            // But respect hasEOL even for empty items
            if (item.hasEOL === true && currentLine.length > 0) {
                lines.push(currentLine.join(''));
                currentLine = [];
            }
            continue;
        }

        // Get Y coordinate from transform matrix [a, b, c, d, e, f]
        // where f (transform[5]) is the Y coordinate
        const currentY = item.transform?.[5] ?? 0;

        // Check if we should start a new line:
        // 1. If item has hasEOL flag set to true
        // 2. If Y coordinate changed significantly (different line)
        const hasEOL = item.hasEOL === true;
        const yChanged = lastY !== null && Math.abs(currentY - lastY) > Y_TOLERANCE;

        // If Y changed, finalize current line and start new one
        if (yChanged && currentLine.length > 0) {
            lines.push(currentLine.join(''));
            currentLine = [];
        }

        // Add text to current line
        if (currentLine.length > 0) {
            // Add space if not the first item on the line
            currentLine.push(' ');
        }
        currentLine.push(text);

        // Check if this item ends the line (hasEOL)
        if (hasEOL) {
            lines.push(currentLine.join(''));
            currentLine = [];
        }

        lastY = currentY;
    }

    // Add remaining text as final line
    if (currentLine.length > 0) {
        lines.push(currentLine.join(''));
    }

    // Join lines with newline character
    return lines.join('\n');
}

/**
 * Get cached PDF text or extract it if not cached
 */
export async function getCachedPdfText(
    pdfFilePath: string,
    pdfDocument?: any
): Promise<ProcessPdfResult & {
    pages: Array<{ page_number: number; text: string; width: number; height: number; image_base64?: string | null }>;
}> {
    // Check cache first
    if (pdfTextCache.has(pdfFilePath)) {
        const cached = pdfTextCache.get(pdfFilePath)!;
        // Ensure cached pages have width/height
        const pagesWithDimensions = cached.pages.map((page: any) => ({
            ...page,
            width: page.width ?? 595.0,
            height: page.height ?? 842.0,
            image_base64: page.image_base64 ?? null,
        }));
        return {
            ...cached,
            pages: pagesWithDimensions,
        };
    }

    // Try to extract text from pdf.js document if available
    if (pdfDocument) {
        try {
            const pages: Array<{ page_number: number; text: string; width: number; height: number; image_base64?: string | null }> = [];
            const numPages = pdfDocument.numPages;

            for (let i = 1; i <= numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();
                
                // Extract text while preserving line breaks
                // Strategy:
                // 1. Use item.hasEOL when available to detect line breaks
                // 2. Fallback: Group items by Y coordinate (transform[5]) with tolerance
                const pageText = extractTextWithLineBreaks(textContent);

                // Get page dimensions (viewport size)
                const viewport = page.getViewport({ scale: 1.0 });

                pages.push({
                    page_number: i,
                    text: pageText,
                    width: viewport.width,
                    height: viewport.height,
                    image_base64: null,
                });
            }

            const result: ProcessPdfResult & {
                pages: Array<{ page_number: number; text: string; width: number; height: number; image_base64?: string | null }>;
            } = {
                pages,
                total_pages: numPages,
                extractable_pages: numPages,
            };

            // Cache the result
            pdfTextCache.set(pdfFilePath, result);
            return result;
        } catch (error) {
            console.warn('[PDF Search] Failed to extract text from pdf.js document:', error);
        }
    }

    // Fallback to Tauri command
    try {
        // Tauri returns PdfProcessingResult which includes width/height in pages
        // but TypeScript type doesn't reflect this, so we cast it
        const result = await invoke<any>('extract_pdf_sync', {
            filepath: pdfFilePath,
        });

        // Cast pages to include optional dimensions
        const resultPages = result.pages as Array<{ 
            page_number: number; 
            text: string; 
            width?: number; 
            height?: number; 
            image_base64?: string | null 
        }>;

        // Ensure all pages have width/height (Tauri should provide them, but add defaults if missing)
        const pagesWithDimensions = resultPages.map(page => ({
            ...page,
            width: page.width ?? 595.0,
            height: page.height ?? 842.0,
            image_base64: page.image_base64 ?? null,
        }));

        const normalizedResult: ProcessPdfResult & {
            pages: Array<{ page_number: number; text: string; width: number; height: number; image_base64?: string | null }>;
        } = {
            ...result,
            pages: pagesWithDimensions,
        };

        // Cache the result
        pdfTextCache.set(pdfFilePath, normalizedResult);
        return normalizedResult;
    } catch (error) {
        console.error('[PDF Search] Failed to extract PDF text:', error);
        throw error;
    }
}

/**
 * Enhanced PDF search using Rust backend
 */
export async function searchPdfEnhanced(
    pages: Array<{ page_number: number; text: string; width: number; height: number; image_base64?: string | null }>,
    query: string,
    options: SearchOptions
): Promise<SearchMatch[]> {
    try {
        // Ensure all pages have required fields for Rust struct
        const pagesWithRequiredFields = pages.map(page => ({
            page_number: page.page_number,
            text: page.text,
            width: page.width || 595.0, // Default A4 width if missing
            height: page.height || 842.0, // Default A4 height if missing
            image_base64: page.image_base64 ?? null,
        }));

        const results = await invoke<SearchMatch[]>('search_pdf_text_enhanced', {
            pages: pagesWithRequiredFields,
            query,
            caseSensitive: options.caseSensitive,
            wholeWords: options.wholeWords,
        });

        return results;
    } catch (error) {
        console.error('[PDF Search] Enhanced search failed:', error);
        throw error;
    }
}

/**
 * Clear PDF text cache
 */
export function clearPdfTextCache(pdfFilePath?: string): void {
    if (pdfFilePath) {
        pdfTextCache.delete(pdfFilePath);
    } else {
        pdfTextCache.clear();
    }
}

