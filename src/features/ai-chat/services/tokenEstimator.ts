import type { ChatMessage } from '../types';

/**
 * Estimates the number of tokens in a text string.
 * Uses a rough approximation of 4 characters per token.
 * This is a simplified estimation - actual tokenization varies by model.
 *
 * @param text - The text to estimate tokens for
 * @returns Estimated number of tokens
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }
  // Roughly 4 characters per token (simplified estimation)
  return Math.ceil(text.length / 4);
}

/**
 * Calculates the total token count from an array of messages
 *
 * @param messages - Array of chat messages
 * @returns Total token count
 */
export function calculateTotalTokens(messages: ChatMessage[]): number {
  return messages.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0);
}

/**
 * Formats a token count with commas for readability
 *
 * @param count - The token count to format
 * @returns Formatted string with commas
 */
export function formatTokenCount(count: number): string {
  return count.toLocaleString();
}