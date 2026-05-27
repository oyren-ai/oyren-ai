import type { ChatMessage, PendingImage, MessageFile, StructuredError } from '../types';
import type { ArxivPaperMeta, UserIntent } from '@/api/types/ai';
import { estimateTokens } from '../services/tokenEstimator';
import { embedArxivPapers } from '../utils/arxivContentUtils';

export function createUserMessage(
  messageTextDisplayedInChatBubble: string,
  images: PendingImage[],
  files?: MessageFile[],
  messageTextWithFileContentsSentToAI?: string
): ChatMessage {
  // For UI display: if only images and no text, show empty content
  // The messageTextWithFileContentsSentToAI will have the fallback for AI
  const displayContent = messageTextDisplayedInChatBubble.trim();
  
  const userMessage = {
    id: Date.now().toString(),
    type: 'user' as const,
    content: displayContent, // Empty string if no text, so UI can handle image-only
    messageTextWithFileContentsSentToAI,
    timestamp: new Date(),
    images: images.length > 0 ? images : undefined,
    files: files && files.length > 0 ? files : undefined,
    tokenCount: estimateTokens(displayContent || messageTextWithFileContentsSentToAI || '')
  };
  
  console.log(`[createUserMessage] ✅ Created user message with ${images.length} images, hasText: ${!!displayContent}`, {
    hasImages: !!userMessage.images,
    imageCount: userMessage.images?.length,
    contentLength: displayContent.length
  });
  
  return userMessage;
}

export function createAssistantMessage(
  content: string,
  inputTokens?: number,
  outputTokens?: number,
  arxivPapers?: ArxivPaperMeta[],
  userIntent?: UserIntent,
): ChatMessage {
  const persistedContent = embedArxivPapers(content, arxivPapers);
  return {
    id: (Date.now() + 1).toString(),
    type: 'assistant',
    content: persistedContent,
    timestamp: new Date(),
    inputTokens,
    outputTokens,
    tokenCount: (inputTokens || 0) + (outputTokens || 0) || estimateTokens(content),
    arxiv_papers: arxivPapers && arxivPapers.length > 0 ? arxivPapers : undefined,
    user_intent: userIntent,
  };
}

export function createErrorMessage(error: unknown | string, sidecarError?: StructuredError): ChatMessage {
  const errorText = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : 'Failed to get response';

  // Use sidecarError if provided (from API response), otherwise use plain error text
  const displayMessage = sidecarError?.message || sidecarError?.shortMessage || errorText;

  return {
    id: (Date.now() + 1).toString(),
    type: 'assistant',
    content: displayMessage,
    timestamp: new Date(),
    isError: true,
    structuredError: sidecarError || undefined
  };
}
