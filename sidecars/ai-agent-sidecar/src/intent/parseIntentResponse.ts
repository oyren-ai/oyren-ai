import { UserIntent } from "./types.ts";
import { hasAnyDocumentContext } from "@/prompts/documentContext.ts";
import type { ConversationMessage } from "@/types/ConversationMessage.ts";
import type { FileAttachment } from "@/types/AgentRequest.ts";

const VALID_INTENTS = new Set(["paper_search", "chat_pdf_markdown", "chat_no_pdf_markdown"]);

export function parseIntentResponse(
  raw: string,
  message: string,
  history: ConversationMessage[] = [],
  files?: FileAttachment[],
): UserIntent {
  const jsonStr = extractJsonFromResponse(raw);
  try {
    const parsed = JSON.parse(jsonStr);
    return validateAndNormalize(parsed, message, history, files);
  } catch {
    return documentAwareFallback(message, history, files);
  }
}

function extractJsonFromResponse(raw: string): string {
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return raw;
}

function validateAndNormalize(
  parsed: Record<string, unknown>,
  message: string,
  history: ConversationMessage[],
  files?: FileAttachment[],
): UserIntent {
  const rawIntent = parsed.intent as string;
  const hasContext = hasAnyDocumentContext(message, history, files);
  const intent = VALID_INTENTS.has(rawIntent)
    ? rawIntent as UserIntent["intent"]
    : (hasContext ? "chat_pdf_markdown" : "chat_no_pdf_markdown");

  return new UserIntent({
    intent,
    topics: ensureStringArray(parsed.topics),
    keywords: ensureStringArray(parsed.keywords),
    authors: parsed.authors ? ensureStringArray(parsed.authors) : undefined,
    categories: parsed.categories ? ensureStringArray(parsed.categories) : undefined,
  });
}

function documentAwareFallback(
  message: string,
  history: ConversationMessage[],
  files?: FileAttachment[],
): UserIntent {
  const hasContext = hasAnyDocumentContext(message, history, files);
  return new UserIntent({
    intent: hasContext ? "chat_pdf_markdown" : "chat_no_pdf_markdown",
    topics: [],
    keywords: [],
  });
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
