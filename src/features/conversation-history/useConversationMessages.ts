import { useState, useCallback, useEffect } from 'react';
import { conversationApi } from '@/api/conversationApi';
import type { ConversationWithMessages, ImageData } from '@/types/conversation';

export function useConversationMessages(conversationId: string) {
  const [data, setData] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(false);

  const loadConversation = useCallback(async () => {
    if (!conversationId) {
      setData(null);
      return;
    }

    setLoading(true);
    try {
      const conversation = await conversationApi.get(conversationId);
      setData(conversation);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  const addMessage = useCallback(
    async (
      role: 'user' | 'assistant',
      content: string,
      images?: ImageData[],
      inputTokens?: number,
      outputTokens?: number
    ) => {
      if (!conversationId) return;

      try {
        const message = await conversationApi.addMessage(
          conversationId,
          role,
          content,
          images,
          undefined, // files
          undefined, // provider
          undefined, // model
          inputTokens,
          outputTokens
        );

        setData((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, message],
              }
            : null
        );
      } catch (error) {
        console.error('Failed to add message:', error);
        throw error;
      }
    },
    [conversationId]
  );

  return {
    data,
    loading,
    loadConversation,
    addMessage,
  };
}
