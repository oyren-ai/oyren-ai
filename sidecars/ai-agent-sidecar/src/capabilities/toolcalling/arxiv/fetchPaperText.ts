import { stripHtmlToText, truncateText } from "./htmlToText.ts";

const AR5IV_BASE_URL = "https://ar5iv.labs.arxiv.org/html";
const MAX_TEXT_LENGTH = 8000;
const DEFAULT_FETCH_TIMEOUT_MS = 15000;

export interface FetchPaperResult {
  fullText: string;
  source: "ar5iv" | "abstract-only";
}

export async function fetchPaperText(
  arxivId: string,
  abstractFallback?: string,
): Promise<FetchPaperResult> {
  try {
    const html = await fetchAr5ivHtml(arxivId);
    const text = stripHtmlToText(html);
    const truncated = truncateText(text, MAX_TEXT_LENGTH);
    return { fullText: truncated, source: "ar5iv" };
  } catch {
    return {
      fullText: abstractFallback || `Could not fetch full text for ${arxivId}.`,
      source: "abstract-only",
    };
  }
}

export async function fetchAr5ivHtml(
  arxivId: string,
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${AR5IV_BASE_URL}/${arxivId}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`ar5iv returned ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}
