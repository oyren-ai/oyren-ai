import {
  BASE_SYSTEM_PROMPT,
  SHORT_MODE_INSTRUCTIONS,
  CONCISE_MODE_INSTRUCTIONS,
  DETAILED_MODE_INSTRUCTIONS,
  TOOL_USAGE_INSTRUCTIONS,
  DOCUMENT_CITATION_INSTRUCTIONS,
  NO_DOCUMENT_SUGGESTION,
  EMPTY_DOCUMENT_SUGGESTION,
} from "./components/systemPromptComponents.ts";
import {
  MDX_LATEX_INSTRUCTIONS,
  CITATION_FORMAT_INSTRUCTIONS,
} from "./components/responseFormat.ts";
import { hasAnyDocumentContext, countDocuments, hasEmptyDocuments } from "./documentContext.ts";
import type { ConversationMessage } from "@/types/ConversationMessage.ts";
import type { FileAttachment } from "@/types/AgentRequest.ts";

export interface PromptBuildOptions {
  answerMode?: "short" | "concise" | "detailed";
  message: string;
  conversationHistory?: ConversationMessage[];
  files?: FileAttachment[];
  attachedFileNames?: string[];
}

export function createSystemMessage(options: PromptBuildOptions): ConversationMessage {
  return {
    role: "system",
    content: buildSystemPrompt(options),
  };
}

export function buildSystemPrompt(options: PromptBuildOptions): string {
  const { answerMode = "detailed", message, conversationHistory = [], files, attachedFileNames } = options;

  const sections: string[] = [BASE_SYSTEM_PROMPT];

  // Add answer mode instructions
  if (answerMode === "short") {
    sections.push(SHORT_MODE_INSTRUCTIONS);
  } else if (answerMode === "concise") {
    sections.push(CONCISE_MODE_INSTRUCTIONS);
  } else {
    sections.push(DETAILED_MODE_INSTRUCTIONS);
  }

  // Add tool usage instructions
  sections.push(TOOL_USAGE_INSTRUCTIONS);

  // Add document-aware instructions based on the content state
  if (hasAnyDocumentContext(message, conversationHistory, files, attachedFileNames)) {
    const docCount = countDocuments(message);
    sections.push(DOCUMENT_CITATION_INSTRUCTIONS);
    if (docCount > 0) {
      sections.push(
        `\nNote: You have been provided with ${docCount} document${docCount > 1 ? "s" : ""} to reference.`
      );
    }
  } else if (hasEmptyDocuments(message)) {
    sections.push(EMPTY_DOCUMENT_SUGGESTION);
  } else {
    sections.push(NO_DOCUMENT_SUGGESTION);
  }

  // Always add formatting instructions
  sections.push(MDX_LATEX_INSTRUCTIONS);
  sections.push(CITATION_FORMAT_INSTRUCTIONS);

  return sections.join("\n\n");
}
