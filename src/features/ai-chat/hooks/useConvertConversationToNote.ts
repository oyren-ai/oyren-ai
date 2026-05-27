import { useState, useCallback } from 'react';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import { convertConversationToMdx } from '../utils/convertConversationToMdx';
import type { ChatMessage } from '../types';

interface ConvertToNoteOptions {
  messages: ChatMessage[];
  workspaceId: string;
  provider?: string;
  model?: string;
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  title?: string;
}

export function useConvertConversationToNote() {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertToNote = useCallback(async (options: ConvertToNoteOptions) => {
    const { messages, workspaceId, provider, model, totalTokens, inputTokens, outputTokens, title } = options;

    // Validate inputs
    if (!workspaceId) {
      setError('No workspace selected');
      return null;
    }

    if (!messages || messages.length === 0) {
      setError('No messages to convert');
      return null;
    }

    setIsConverting(true);
    setError(null);

    try {
      // Generate MDX content
      const mdxContent = convertConversationToMdx(messages, {
        title,
        provider,
        model,
        totalTokens,
        inputTokens,
        outputTokens,
      });

      // Generate note name from title or first message
      const noteName = generateNoteName(messages, title);

      // Step 1: Create the note file
      const file = await workspaceFilesApi.createMdxNote(workspaceId, noteName);

      // Step 2: Update with actual content
      await workspaceFilesApi.updateFile(file.id, mdxContent);

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('workspace-file-created', {
        detail: { file }
      }));

      return file;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to convert conversation to note';
      setError(errorMessage);
      console.error('Error converting conversation to note:', err);
      return null;
    } finally {
      setIsConverting(false);
    }
  }, []);

  return {
    convertToNote,
    isConverting,
    error,
  };
}

/**
 * Generates a file name from conversation title or first message
 */
function generateNoteName(messages: ChatMessage[], title?: string): string {
  if (title) {
    return sanitizeFileName(title);
  }

  const firstUserMessage = messages.find(msg => msg.type === 'user');

  if (!firstUserMessage) {
    return `Conversation-${Date.now()}`;
  }

  // Use first 30 chars of first message
  const content = firstUserMessage.content.trim();
  const truncated = content.length > 30 ? content.substring(0, 30) : content;

  return sanitizeFileName(truncated);
}

/**
 * Sanitizes a string to be used as a filename
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, '') // Remove invalid filename characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/\.+$/, '') // Remove trailing dots
    .trim();
}