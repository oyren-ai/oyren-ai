import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ConversationMessage } from "@/types/ConversationMessage.ts";
import type { FileAttachment } from "@/types/AgentRequest.ts";
import { UserIntent } from "./types.ts";
import { INTENT_EXTRACTION_PROMPT } from "./intentPrompt.ts";
import { parseIntentResponse } from "./parseIntentResponse.ts";
import { hasAnyDocumentContext } from "@/prompts/documentContext.ts";

export async function extractIntent(
  llmChatClient: LlmChatClient,
  message: string,
  history: ConversationMessage[],
  files?: FileAttachment[],
): Promise<UserIntent> {
  try {
    const contextSummary = buildContextSummary(history);
    const userPrompt = contextSummary
      ? `Context from conversation:\n${contextSummary}\n\nCurrent message: ${message}`
      : message;

    const messages = [
      new SystemMessage(INTENT_EXTRACTION_PROMPT),
      new HumanMessage(userPrompt),
    ];

    const response = await llmChatClient.invoke(messages);

    const content = typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

    return parseIntentResponse(content, message, history, files);
  } catch {
    const intent = hasAnyDocumentContext(message, history, files)
      ? "chat_pdf_markdown"
      : "chat_no_pdf_markdown";
    return new UserIntent({ intent, topics: [], keywords: [] });
  }
}

function buildContextSummary(history: ConversationMessage[]): string {
  if (history.length === 0) return "";
  const recent = history.slice(-4);
  return recent
    .map((msg) => `${msg.role}: ${msg.content.slice(0, 200)}`)
    .join("\n");
}
