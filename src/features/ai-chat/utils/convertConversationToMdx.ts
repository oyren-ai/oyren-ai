import type { ChatMessage } from '../types';
import { extractArxivPapers } from './arxivContentUtils';

export interface ConversationMdxOptions {
  title?: string;
  provider?: string;
  model?: string;
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Converts conversation messages to MDX format
 */
export function convertConversationToMdx(
  messages: ChatMessage[],
  options: ConversationMdxOptions = {}
): string {
  const { title, provider, model, totalTokens, inputTokens, outputTokens } = options;

  // Generate title from first user message or use provided title
  const generatedTitle = title || generateTitleFromMessages(messages);

  // Build frontmatter
  const frontmatter = buildFrontmatter(generatedTitle, provider, model, totalTokens, inputTokens, outputTokens);

  // Build message blocks
  const messageBlocks = messages
    .filter(msg => !msg.isError) // Skip error messages
    .map((msg, index) => buildMessageBlock(msg, index))
    .join('\n\n---\n\n');

  return `${frontmatter}\n\n${messageBlocks}`;
}

/**
 * Generates a title from the first user message
 */
function generateTitleFromMessages(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find(msg => msg.type === 'user');

  if (!firstUserMessage) {
    return 'Conversation';
  }

  // Truncate to ~50 chars and clean up
  const content = firstUserMessage.content.trim();
  const truncated = content.length > 50 ? content.substring(0, 50) + '...' : content;

  // Remove newlines for title
  return truncated.replace(/\n+/g, ' ');
}

/**
 * Builds the MDX frontmatter section
 */
function buildFrontmatter(
  title: string,
  provider?: string,
  model?: string,
  totalTokens?: number,
  inputTokens?: number,
  outputTokens?: number
): string {
  const lines: string[] = [`# ${title}`, ''];

  // Metadata
  const metadata: string[] = [];

  // Date
  metadata.push(`*Created: ${new Date().toLocaleString()}*`);

  // Model info
  if (provider && model) {
    metadata.push(`*Model: ${provider}/${model}*`);
  } else if (model) {
    metadata.push(`*Model: ${model}*`);
  }

  // Token info
  if (totalTokens !== undefined || (inputTokens !== undefined && outputTokens !== undefined)) {
    const tokenInfo = formatTokenInfo(totalTokens, inputTokens, outputTokens);
    metadata.push(`*Tokens: ${tokenInfo}*`);
  }

  if (metadata.length > 0) {
    lines.push(metadata.join('  \n'));
    lines.push('');
  }

  lines.push('---');

  return lines.join('\n');
}

/**
 * Formats token information
 */
function formatTokenInfo(total?: number, input?: number, output?: number): string {
  if (total !== undefined) {
    if (input !== undefined && output !== undefined) {
      return `${input} in / ${output} out (${total} total)`;
    }
    return `${total} total`;
  }

  if (input !== undefined && output !== undefined) {
    return `${input} in / ${output} out`;
  }

  return 'N/A';
}

/**
 * Builds a single message block (question/answer pair)
 */
function buildMessageBlock(message: ChatMessage, index: number): string {
  const isUser = message.type === 'user';
  const heading = isUser ? `## 💬 User` : `## 🤖 Assistant`;

  const blocks: string[] = [heading, ''];

  // Add images if present
  if (message.images && message.images.length > 0) {
    message.images.forEach((img, imgIndex) => {
      blocks.push(`![Attached Image ${imgIndex + 1}](data:image/png;base64,${img.data})`);
      blocks.push('');
    });
  }

  // Add message content (strip embedded arxiv block)
  const { displayContent } = extractArxivPapers(message.content);
  blocks.push(displayContent);

  // Add file attachments info if present
  if (message.files && message.files.length > 0) {
    blocks.push('');
    blocks.push('**Attached Files:**');
    message.files.forEach(file => {
      blocks.push(`- ${file.name}`);
    });
  }

  return blocks.join('\n');
}