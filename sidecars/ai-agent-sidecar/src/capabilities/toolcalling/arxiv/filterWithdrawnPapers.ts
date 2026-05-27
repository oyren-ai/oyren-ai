import type { ArxivPaper } from "./types.ts";

const DEFAULT_HEAD_TIMEOUT_MS = 3000;

export async function isPdfAccessible(
  pdfUrl: string,
  timeoutMs = DEFAULT_HEAD_TIMEOUT_MS,
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(pdfUrl, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.status !== 404;
  } catch {
    return true;
  }
}

export async function filterWithdrawnPapers(
  papers: ArxivPaper[],
): Promise<ArxivPaper[]> {
  const results = await Promise.all(
    papers.map(async (paper) => {
      const accessible = await isPdfAccessible(paper.pdf_url);
      return accessible ? paper : null;
    }),
  );
  return results.filter((p): p is ArxivPaper => p !== null);
}
