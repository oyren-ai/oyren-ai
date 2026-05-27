/**
 * Document context utilities for AI agent
 */

import type { ConversationMessage } from "@/types/ConversationMessage.ts";
import type { FileAttachment } from "@/types/AgentRequest.ts";

const DOCUMENT_DELIMITER_PATTERN = /---\s+[^-]+\.(pdf|md)\s+---/i;

/**
 * Checks if a message contains document content
 * Document content is identified by the "--- filename ---" delimiters
 */
export function hasDocuments(message: string): boolean {
  return DOCUMENT_DELIMITER_PATTERN.test(message);
}

/**
 * Checks if any message in conversation history contains documents
 */
export function hasDocumentsInHistory(history: ConversationMessage[]): boolean {
  return history.some((msg) => hasDocuments(msg.content));
}

/**
 * Checks if file attachments are present
 */
export function hasFileAttachments(files?: FileAttachment[]): boolean {
  return !!files && files.length > 0;
}

/**
 * Checks if any document context is available (current message, history, or file attachments)
 */
export function hasAnyDocumentContext(
  message: string,
  conversationHistory: ConversationMessage[],
  files?: FileAttachment[],
  attachedFileNames?: string[],
): boolean {
  return hasDocuments(message) || hasDocumentsInHistory(conversationHistory) || hasFileAttachments(files) || (!!attachedFileNames && attachedFileNames.length > 0);
}

/**
 * Counts the number of documents in a message
 * Documents are identified by "--- filename.(pdf|md) ---" delimiters
 */
export function countDocuments(message: string): number {
  const matches = message.match(/---\s+[^-]+\.(pdf|md)\s+---/gi);
  return matches ? matches.length : 0;
}

/**
 * Checks if a message contains empty file markers
 * Empty files are identified by "[EMPTY_FILE: filename]" markers
 */
export function hasEmptyDocuments(message: string): boolean {
  return /\[EMPTY_FILE:\s+[^\]]+\]/.test(message);
}

/**
 * Counts the number of empty file markers in a message
 */
export function countEmptyDocuments(message: string): number {
  const matches = message.match(/\[EMPTY_FILE:\s+[^\]]+\]/g);
  return matches ? matches.length : 0;
}
