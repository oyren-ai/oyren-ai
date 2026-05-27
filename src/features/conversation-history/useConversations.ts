import { useState, useCallback, useEffect } from 'react';
import { conversationApi } from '@/api/conversationApi';
import type { Conversation } from '@/types/conversation';

export function useConversations(workspaceId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!workspaceId) return;

    setLoading(true);
    try {
      const data = await conversationApi.listByWorkspace(workspaceId);
      // Sort conversations: pinned first, then by updated_at descending
      const sorted = data.sort((a, b) => {
        // First, sort by pinned status (pinned first)
        if (a.is_pinned !== b.is_pinned) {
          return a.is_pinned ? -1 : 1;
        }
        // Then sort by updated_at (most recent first)
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      setConversations(sorted);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const handlers = {
      created: () => void loadConversations(),
      updated: () => void loadConversations(),
      deleted: () => void loadConversations(),
    };

    window.addEventListener('conversation-created', handlers.created);
    window.addEventListener('conversation-updated', handlers.updated);
    window.addEventListener('conversation-deleted', handlers.deleted);

    return () => {
      window.removeEventListener('conversation-created', handlers.created);
      window.removeEventListener('conversation-updated', handlers.updated);
      window.removeEventListener('conversation-deleted', handlers.deleted);
    };
  }, [loadConversations]);

  return {
    conversations,
    loading,
  };
}
