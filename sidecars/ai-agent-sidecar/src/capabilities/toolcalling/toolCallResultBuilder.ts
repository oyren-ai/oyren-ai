import type { AIMessage } from "@langchain/core/messages";
import type { ArxivPaperMeta } from "./arxiv/types.ts";

export interface ToolCallResult {
  finalResponse: string;
  arxivPapers: ArxivPaperMeta[];
  usageMetadata?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
}

export function collectPapersFromSearch(
  toolResult: string,
  collectedPapers: ArxivPaperMeta[],
): void {
  try {
    const parsed = JSON.parse(toolResult);
    if (parsed.papers) {
      const existingIds = new Set(collectedPapers.map((p) => p.id));
      for (const p of parsed.papers) {
        if (existingIds.has(p.id)) continue;
        existingIds.add(p.id);
        collectedPapers.push({
          id: p.id,
          title: p.title,
          authors: Array.isArray(p.authors) ? p.authors : [p.authors],
          summary: p.summary,
          arxiv_url: p.arxiv_url,
          pdf_url: p.pdf_url,
          published: p.published,
        });
      }
    }
  } catch { /* non-JSON result, skip */ }
}

function extractTextFromContent(content: string | unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part: { type?: string }) => part.type === "text")
      .map((part: { text?: string }) => part.text ?? "")
      .join("\n");
  }
  if (typeof content === "object" && content !== null) {
    return JSON.stringify(content);
  }
  return String(content ?? "");
}

export function buildToolCallResult(
  lastResponse: AIMessage | null,
  collectedPapers: ArxivPaperMeta[],
): ToolCallResult {
  const content = lastResponse
    ? extractTextFromContent(lastResponse.content)
    : "";

  return {
    finalResponse: content,
    arxivPapers: collectedPapers,
    usageMetadata: lastResponse?.usage_metadata as ToolCallResult["usageMetadata"],
  };
}
