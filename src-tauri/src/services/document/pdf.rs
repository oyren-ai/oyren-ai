use crate::adapters::os::file;
use crate::config::constants::{
    PDF_PLACEHOLDER_PAGE_HEIGHT, PDF_PLACEHOLDER_PAGE_WIDTH, PDF_SEARCH_CONTEXT_LINES_AFTER,
    PDF_SEARCH_CONTEXT_LINES_BEFORE,
};
use crate::errors::{file_error_to_pdf_service_error, PdfServiceError};
use pdf_extract::extract_text;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::panic;

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
    pub creator: Option<String>,
    pub producer: Option<String>,
    pub creation_date: Option<String>,
    pub modification_date: Option<String>,
    pub page_count: usize,
    pub file_size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfPageContent {
    pub page_number: usize,
    pub text: String,
    pub image_base64: Option<String>,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfProcessingResult {
    pub metadata: PdfMetadata,
    pub pages: Vec<PdfPageContent>,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchOptions {
    pub case_sensitive: bool,
    pub whole_words: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchMatch {
    pub page_number: usize,
    pub line_number: usize,
    pub context: String,
    pub match_text: String,
    pub start_pos: usize,
    pub end_pos: usize,
    pub context_start_line: usize, // Line number where context starts
}

// PDF service functions - using functional style instead of OOP

/// Read a PDF file and return its raw bytes
pub fn read_pdf_file(filepath: &str) -> Result<Vec<u8>, PdfServiceError> {
    file::read_file(filepath).map_err(file_error_to_pdf_service_error)
}

// Removed extract_pdf_async (marker sidecar) - replaced with slidev sidecar

/// Extract PDF text synchronously using basic extraction (fast, lightweight)
/// This method uses the pdf-extract Rust crate for quick text extraction.
/// Faster but may fail on complex PDFs. Good for simple documents and previews.
pub fn extract_pdf_sync(filepath: &str) -> Result<PdfProcessingResult, PdfServiceError> {
    // Check if file exists using the adapter
    if !file::file_exists(filepath) {
        return Err(PdfServiceError::InvalidPdf {
            path: filepath.to_string(),
        });
    }

    // Get file metadata using the adapter
    let file_metadata =
        file::get_file_metadata(filepath).map_err(file_error_to_pdf_service_error)?;
    let file_size = file_metadata.len();

    // Extract text from PDF using pdf-extract with panic protection
    let extraction_result = panic::catch_unwind(|| extract_text(filepath));

    let (extracted_text, extraction_failed) = match extraction_result {
        Ok(Ok(text)) => {
            // Successful extraction
            if text.trim().is_empty() {
                ("No readable text could be extracted from this PDF. The document may contain only images or use unsupported fonts.".to_string(), false)
            } else {
                (text, false)
            }
        }
        Ok(Err(e)) => {
            // Extraction returned an error
            println!("[PDF] Text extraction error: {}", e);
            let placeholder = format!(
                    "Unable to extract text from this PDF due to format issues. The file may use an unsupported encoding or be corrupted.\n\nError details: {}\n\nYou can still try to send the PDF to AI, but results may be limited.",
                    e
                );
            (placeholder, true)
        }
        Err(panic_err) => {
            // Extraction panicked (e.g., font parsing errors)
            let panic_msg = if let Some(s) = panic_err.downcast_ref::<&str>() {
                s.to_string()
            } else if let Some(s) = panic_err.downcast_ref::<String>() {
                s.clone()
            } else {
                "Unknown panic".to_string()
            };

            println!("[PDF] Text extraction panicked: {}", panic_msg);
            let placeholder = format!(
                    "Unable to extract text from this PDF. The file contains problematic fonts or encoding that cannot be processed.\n\nTechnical details: {}\n\nYou can still view the PDF and send it to AI using Marker extraction.",
                    panic_msg
                );
            (placeholder, true)
        }
    };

    // If extraction failed, we can't determine extractable pages
    let (pages, extractable_page_count) = if extraction_failed {
        // Create a single placeholder page with error message
        let placeholder_page = PdfPageContent {
            page_number: 1,
            text: extracted_text.clone(),
            image_base64: None,
            width: PDF_PLACEHOLDER_PAGE_WIDTH,
            height: PDF_PLACEHOLDER_PAGE_HEIGHT,
        };

        // Return 0 to indicate unknown extractable pages
        (vec![placeholder_page], 0)
    } else {
        // Clean up the extracted text for better display
        let cleaned_text = clean_extracted_text(&extracted_text);

        // Split text into logical pages/sections
        let pages = split_text_into_pages(&cleaned_text);

        // The extractable page count is based on how we split the extracted text
        let extractable_count = pages.len();

        (pages, extractable_count)
    };

    let metadata = PdfMetadata {
        title: None,
        author: None,
        subject: None,
        creator: None,
        producer: None,
        creation_date: None,
        modification_date: None,
        page_count: extractable_page_count,
        file_size,
    };

    Ok(PdfProcessingResult {
        metadata,
        pages,
        success: true,
        error: None,
    })
}

/// Search for text in PDF pages
pub fn search_pdf_text(
    pages: Vec<PdfPageContent>,
    query: String,
) -> Result<Vec<(usize, Vec<String>)>, PdfServiceError> {
    let mut results = Vec::new();
    let query_lower = query.to_lowercase();

    for page in pages {
        let text_lower = page.text.to_lowercase();
        if text_lower.contains(&query_lower) {
            // Find all occurrences and their context
            let mut matches = Vec::new();
            let lines: Vec<&str> = page.text.lines().collect();

            for (line_idx, line) in lines.iter().enumerate() {
                if line.to_lowercase().contains(&query_lower) {
                    // Get context lines before and after the match
                    let start = if line_idx >= PDF_SEARCH_CONTEXT_LINES_BEFORE {
                        line_idx - PDF_SEARCH_CONTEXT_LINES_BEFORE
                    } else {
                        0
                    };
                    let end =
                        std::cmp::min(line_idx + PDF_SEARCH_CONTEXT_LINES_AFTER + 1, lines.len());

                    let context: Vec<String> =
                        lines[start..end].iter().map(|l| l.to_string()).collect();

                    matches.push(context.join("\n"));
                }
            }

            if !matches.is_empty() {
                results.push((page.page_number, matches));
            }
        }
    }

    Ok(results)
}

/// Enhanced search with regex support for better accuracy
/// Handles case sensitivity, whole words, line breaks, and hyphenated breaks
/// 
/// Uses SINGLE PASS on full page text to avoid duplicate offset issues.
/// All offsets are absolute within the page text.
pub fn search_pdf_text_enhanced(
    pages: Vec<PdfPageContent>,
    query: String,
    options: SearchOptions,
) -> Result<Vec<SearchMatch>, PdfServiceError> {
    println!("[Rust Search] Starting search for: '{}'", query);
    println!("[Rust Search] Pages count: {}", pages.len());
    println!(
        "[Rust Search] Options: case_sensitive={}, whole_words={}",
        options.case_sensitive, options.whole_words
    );

    let mut results = Vec::new();

    // Build regex pattern
    let pattern = build_search_regex(&query, &options)?;
    println!("[Rust Search] Regex pattern: {}", pattern.as_str());

    for page in &pages {
        println!(
            "[Rust Search] Searching page {}, text length: {}",
            page.page_number,
            page.text.len()
        );

        let page_text = &page.text;

        // Pre-compute line start offsets for efficient line number lookup
        let line_starts: Vec<usize> = std::iter::once(0)
            .chain(
                page_text
                    .char_indices()
                    .filter(|(_, c)| *c == '\n')
                    .map(|(i, _)| i + 1),
            )
            .collect();
        let lines: Vec<&str> = page_text.lines().collect();

        // SINGLE PASS: Search on full page text using find_iter
        // All offsets are absolute within page_text
        for matched in pattern.find_iter(page_text) {
            let match_start = matched.start();
            let match_end = matched.end();

            // Find which line this match starts on using binary search
            let line_idx = match line_starts.binary_search(&match_start) {
                Ok(idx) => idx,             // Exact match at line start
                Err(idx) => idx.saturating_sub(1), // In the middle of a line
            };

            println!(
                "[Rust Search] Found match at offset {}-{}, line {}: '{}'",
                match_start,
                match_end,
                line_idx + 1,
                matched.as_str()
            );

            // Get context lines
            let context_start = line_idx.saturating_sub(PDF_SEARCH_CONTEXT_LINES_BEFORE);
            let context_end = std::cmp::min(line_idx + PDF_SEARCH_CONTEXT_LINES_AFTER + 1, lines.len());
            let context = lines[context_start..context_end].join("\n");

            results.push(SearchMatch {
                page_number: page.page_number,
                line_number: line_idx + 1,
                context,
                match_text: matched.as_str().to_string(),
                start_pos: match_start,
                end_pos: match_end,
                context_start_line: context_start + 1, // 1-based line number
            });
        }
    }

    println!("[Rust Search] Total matches found: {}", results.len());
    Ok(results)
}

/// Build regex pattern for search with proper escaping and options.
///
/// Between every consecutive word pair the separator allows:
///   - One or more Unicode whitespace chars (incl. NBSP, U+00A0, via `\s` in Unicode mode)
///   - A hard hyphen `-` or soft hyphen U+00AD followed by optional whitespace
///     (covers PDF line-break artefacts like "multi-\nword")
///   - Nothing at all (covers text items merged without a gap: "wordword")
fn build_search_regex(query: &str, options: &SearchOptions) -> Result<Regex, PdfServiceError> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Err(PdfServiceError::InvalidPdf {
            path: "Empty search query".to_string(),
        });
    }

    // split_whitespace handles spaces, tabs, newlines, and NBSP (Unicode \s)
    let words: Vec<&str> = trimmed.split_whitespace().collect();

    let escaped_words: Vec<String> = words.iter().map(|w| regex::escape(w)).collect();

    let pattern = if escaped_words.len() == 1 {
        if options.whole_words {
            format!(r"\b{}\b", escaped_words[0])
        } else {
            escaped_words[0].clone()
        }
    } else {
        // Between words the separator matches:
        //   \s+           — one or more Unicode whitespace (space, tab, LF, CR, NBSP, …)
        //   [-\u{00AD}]\s* — hard or soft hyphen followed by optional whitespace
        //                    (handles "word-\nword" and "word\u{00AD}word" line-break forms)
        //   (empty)       — zero chars (handles merged text items with no gap)
        let inner_pattern = escaped_words
            .iter()
            .enumerate()
            .map(|(i, word)| {
                if i == escaped_words.len() - 1 {
                    word.to_string()
                } else {
                    format!(r"{}(?:[\s]+|[-\u{{00AD}}][\s]*|)", word)
                }
            })
            .collect::<Vec<_>>()
            .join("");

        if options.whole_words {
            format!(r"\b{}\b", inner_pattern)
        } else {
            inner_pattern
        }
    };

    let regex_str = if options.case_sensitive {
        pattern
    } else {
        format!("(?i){}", pattern)
    };

    Regex::new(&regex_str).map_err(|e| PdfServiceError::InvalidPdf {
        path: format!("Regex error: {}", e),
    })
}

// Helper function to clean extracted text
pub(crate) fn clean_extracted_text(text: &str) -> String {
    let mut cleaned = text.to_string();

    // Remove excessive whitespace
    cleaned = cleaned.trim().to_string();

    // Replace multiple spaces with single space
    cleaned = regex::Regex::new(r"\s+")
        .unwrap()
        .replace_all(&cleaned, " ")
        .to_string();

    // Add proper line breaks after periods (likely end of sentences)
    cleaned = regex::Regex::new(r"\.(\s+)([A-Z])")
        .unwrap()
        .replace_all(&cleaned, ".\n\n$2")
        .to_string();

    // Add line breaks after section numbers (like "4.1", "4.2", etc.)
    cleaned = regex::Regex::new(r"(\d+\.\d+\s+[A-Z][a-z]+)")
        .unwrap()
        .replace_all(&cleaned, "\n\n$1")
        .to_string();

    // Clean up paragraph spacing
    cleaned = regex::Regex::new(r"\n\s*\n\s*\n")
        .unwrap()
        .replace_all(&cleaned, "\n\n")
        .to_string();

    cleaned
}

// Helper function to clean extracted text (focused on academic papers with references)
#[allow(dead_code)]
fn clean_extracted_text_with_sentences(text: &str) -> String {
    // Start with basic cleaning
    let mut cleaned = clean_extracted_text(text);

    // Handle references section more carefully
    // Detect if we're in a references section
    if cleaned.contains("References")
        || cleaned.contains("REFERENCES")
        || cleaned.contains("Bibliography")
    {
        // Don't break at periods within references (they often have "et al.", "pp.", etc.)
        // Instead, look for patterns like "[number]" or "number." at the start of lines
        cleaned = regex::Regex::new(r"\n(\[\d+\]|\d+\.)")
            .unwrap()
            .replace_all(&cleaned, "\n\n$1")
            .to_string();
    }

    // Fix spacing around parenthetical citations
    cleaned = regex::Regex::new(r"\s+(\[\d+\])")
        .unwrap()
        .replace_all(&cleaned, " $1")
        .to_string();

    // Ensure proper spacing after citations
    cleaned = regex::Regex::new(r"(\[\d+\])([A-Z])")
        .unwrap()
        .replace_all(&cleaned, "$1 $2")
        .to_string();

    cleaned
}

// Helper function to split text into logical pages
pub(crate) fn split_text_into_pages(text: &str) -> Vec<PdfPageContent> {
    const MAX_CHARS_PER_PAGE: usize = 50000; // ~50KB per page for AI processing
    let mut pages = Vec::new();

    // Split by major sections if possible
    let sections: Vec<&str> = text.split("\n\n").collect();
    let mut current_page = String::new();
    let mut page_number = 1;

    for section in sections {
        // If adding this section would exceed the limit, create a new page
        if !current_page.is_empty() && current_page.len() + section.len() > MAX_CHARS_PER_PAGE {
            pages.push(PdfPageContent {
                page_number,
                text: current_page.clone(),
                image_base64: None,
                width: PDF_PLACEHOLDER_PAGE_WIDTH,
                height: PDF_PLACEHOLDER_PAGE_HEIGHT,
            });
            current_page.clear();
            page_number += 1;
        }

        if !current_page.is_empty() {
            current_page.push_str("\n\n");
        }
        current_page.push_str(section);
    }

    // Add the last page
    if !current_page.is_empty() {
        pages.push(PdfPageContent {
            page_number,
            text: current_page,
            image_base64: None,
            width: PDF_PLACEHOLDER_PAGE_WIDTH,
            height: PDF_PLACEHOLDER_PAGE_HEIGHT,
        });
    }

    // If no pages were created, create at least one with the full text
    if pages.is_empty() && !text.is_empty() {
        pages.push(PdfPageContent {
            page_number: 1,
            text: text.to_string(),
            image_base64: None,
            width: PDF_PLACEHOLDER_PAGE_WIDTH,
            height: PDF_PLACEHOLDER_PAGE_HEIGHT,
        });
    }

    pages
}

#[cfg(test)]
#[path = "pdf_test.rs"]
mod tests;
