import { useState, useEffect, useCallback } from 'react';

import type { ChatMessage } from '../types';
import { conversationHistoryService } from '@/services/conversationHistoryService';

interface UseChatHistoryProps {
  sessionId?: string;
  pdfPath: string | null;
}

export function useChatHistory({ sessionId, pdfPath }: UseChatHistoryProps) {
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);

  const loadChatHistory = useCallback(async (
    setMessages: (messages: ChatMessage[]) => void
  ) => {
    setIsLoadingHistory(true);

    try {
      if (!sessionId) {
        setMessages([]);
        return undefined;
      }

      const session = await conversationHistoryService.loadSession(sessionId);
      if (session) {
        const restoredMessages: ChatMessage[] = session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(restoredMessages);
        setCurrentSessionId(sessionId);
        return sessionId;
      } else {
        setMessages([]);
        return undefined;
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      setMessages([]);
      return undefined;
    } finally {
      setIsLoadingHistory(false);

    }
  }, [sessionId, pdfPath]);

  const saveChatHistory = useCallback(async (messages: ChatMessage[]) => {
    if (!currentSessionId || messages.length === 0 || !pdfPath) return;

    try {
      await conversationHistoryService.saveConversationForPdf(pdfPath, messages);
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }, [currentSessionId, pdfPath]);

  const startNewChat = useCallback(async () => {
    if (!pdfPath) return undefined;

    try {
      const newSessionId = await conversationHistoryService.startNewConversationSession(pdfPath);
      setCurrentSessionId(newSessionId);
      return newSessionId;
    } catch (error) {
      console.error('Error starting new conversation:', error);
      return undefined;
    }
  }, [pdfPath]);

  return {
    isLoadingHistory,
    currentSessionId,
    loadChatHistory,
    saveChatHistory,
    startNewChat
  };
}