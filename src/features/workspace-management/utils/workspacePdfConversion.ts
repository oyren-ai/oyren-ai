/**
 * Shared PDF → Markdown conversion flow for sidebar and chat.
 * Uses Tauri convert_pdf_with_marker: local PDF → POST /api/pdf-scan → ZIP → extract locally.
 */

import { invoke } from '@tauri-apps/api/core';
import { getMarkerApiBaseUrl, type ConversionResult } from '@/api/markerApi';

const AUTH_TOKEN_KEY = 'oyren_auth_token';

export function getConversionErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (raw.includes('convertPdf') || raw.includes('is not a function'))
    return 'PDF conversion is temporarily unavailable. Please try again later.';
  if (raw.includes('credits') || raw.includes('402'))
    return 'Not enough credits to convert this PDF to Markdown.';
  if (raw.includes('Sign in') || raw.includes('authenticated') || raw.includes('Unauthorized'))
    return 'Please sign in to convert PDFs to Markdown.';
  if (raw.includes('workspace') || raw.includes('No workspace'))
    return 'Please select a workspace first.';
  if (raw.includes('fetch') || raw.includes('Failed to fetch') || raw.includes('Not Found') || raw.includes('404'))
    return 'Conversion service is unavailable. Please try again later.';
  return raw || 'Conversion failed. Please try again later.';
}

/**
 * Run workspace PDF conversion (same flow as sidebar).
 * Uses Tauri command: reads local PDF, sends to web /api/pdf-scan, receives ZIP, extracts to workspace.
 * On success: dispatches workspace-files-changed and credits-should-refresh, returns result.
 * Throws on missing auth/workspace or API error.
 */
export async function runWorkspacePdfConversion(
  workspaceId: string,
  workspaceFileId: string,
  estimatedPages?: number
): Promise<ConversionResult> {
  if (!workspaceId) {
    throw new Error('No workspace selected');
  }

  const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) {
    throw new Error('Sign in to convert PDFs to Markdown');
  }

  const result = await invoke<ConversionResult>('convert_pdf_with_marker', {
    workspaceId,
    workspaceFileId,
    authToken,
    estimatedPages: estimatedPages ?? undefined,
    apiBaseUrl: getMarkerApiBaseUrl(),
  });

  window.dispatchEvent(new CustomEvent('workspace-files-changed'));
  window.dispatchEvent(new CustomEvent('credits-should-refresh'));

  return result;
}
