import { useEffect, useRef } from 'react';
import { conversationApi } from '@/api/conversationApi';
import type { ChatMessage } from '../../types';
import type { ImageData } from '@/types/conversation';

export interface UseConversationSyncParams {
  messages: ChatMessage[];
  workspaceId?: string;
  provider: string | null;
  selectedModel: string;
}

/**
 * Generate a safe conversation title from the first user message
 * Handles text, image-only, and empty messages gracefully
 */
function generateConversationTitle(firstUserMessage: ChatMessage | undefined): string {
  if (!firstUserMessage) {
    return `Chat ${new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  }

  // Priority 1: Use text content if available
  const textContent = firstUserMessage.content?.trim();
  if (textContent) {
    return textContent.substring(0, 50) + (textContent.length > 50 ? '...' : '');
  }

  // Priority 2: If no text but has images, use "Image" or "Snippet"
  if (firstUserMessage.images && firstUserMessage.images.length > 0) {
    const count = firstUserMessage.images.length;
    return count === 1 ? 'Image Snippet' : `${count} Image Snippets`;
  }

  // Priority 3: If no text and no images, use timestamp
  return `Chat ${new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export const useConversationSync = ({
  messages,
  workspaceId,
  provider,
  selectedModel,
}: UseConversationSyncParams): { 
  conversationIdRef: React.MutableRefObject<string | null>;
  resetSyncState: () => void;
  markAllMessagesSynced: () => void;
} => {
  const conversationIdRef = useRef<string | null>(null);
  const lastSyncedMessageIdRef = useRef<string | null>(null);
  const isLoadingConversationRef = useRef<boolean>(false);
  const syncInProgressRef = useRef<boolean>(false);

  const resetSyncState = () => {
    lastSyncedMessageIdRef.current = null;
  };

  const markAllMessagesSynced = () => {
    isLoadingConversationRef.current = true;
  };

  useEffect(() => {
    const syncToDatabase = async () => {
      // Prevent concurrent sync operations
      if (syncInProgressRef.current) return;

      // If we're loading a conversation from database, skip sync for this render
      if (isLoadingConversationRef.current) {
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          lastSyncedMessageIdRef.current = lastMessage.id;
        }
        isLoadingConversationRef.current = false;
        return;
      }

      if (!workspaceId || !provider || !selectedModel) return;

      if (messages.length === 0) {
        resetSyncState();
        return;
      }

      syncInProgressRef.current = true;
      try {
        // Create conversation if it doesn't exist
        if (!conversationIdRef.current) {
          const firstUserMessage = messages.find((m) => m.type === 'user');
          const title = generateConversationTitle(firstUserMessage);

          console.log(`[useConversationSync] Creating conversation with title: "${title}"`);

          const conversation = await conversationApi.create(
            workspaceId, title, provider, selectedModel
          );
          conversationIdRef.current = conversation.id;
          window.dispatchEvent(new CustomEvent('conversation-created'));
        }

        const lastMessage = messages[messages.length - 1];
        if (lastSyncedMessageIdRef.current === lastMessage.id) return;

        const role = lastMessage.type === 'user' ? 'user' : 'assistant';
        const images: ImageData[] | undefined = lastMessage.images?.map((img) => {
          const base64Data = img.data.includes(',') ? img.data.split(',')[1] : img.data;
          return { data: base64Data, mime_type: 'image/png' };
        });

        await conversationApi.addMessage(
          conversationIdRef.current, role, lastMessage.content,
          images, lastMessage.files, provider, selectedModel,
          lastMessage.inputTokens, lastMessage.outputTokens
        );

        lastSyncedMessageIdRef.current = lastMessage.id;
        window.dispatchEvent(new CustomEvent('conversation-updated'));
      } catch (error) {
        console.error('[useConversationSync] Failed to sync message to database:', error);
      } finally {
        syncInProgressRef.current = false;
      }
    };

    void syncToDatabase();
  }, [messages, workspaceId, provider, selectedModel]);

  return { conversationIdRef, resetSyncState, markAllMessagesSynced };
};

