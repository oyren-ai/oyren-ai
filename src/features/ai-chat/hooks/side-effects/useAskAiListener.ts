import { useEffect } from 'react';
import type { AnswerMode } from '../../types';

export interface UseAskAiListenerParams {
  sendMessage: (params: {
    messageTextDisplayedInChatBubble: string;
    messageTextWithFileContentsSentToAI?: string;
    images: any[];
    answerMode: AnswerMode;
  }) => void;
  answerMode: AnswerMode;
}

export const useAskAiListener = ({ sendMessage, answerMode }: UseAskAiListenerParams): void => {
  useEffect(() => {
    const handleAskAi = (event: CustomEvent) => {
      const { text, source } = event.detail;
      const messageText = `What does this mean: "${text}"`;
      sendMessage({
        messageTextDisplayedInChatBubble: messageText,
        messageTextWithFileContentsSentToAI: messageText,
        images: [],
        answerMode,
      });
    };

    window.addEventListener('ask-ai', handleAskAi as EventListener);
    return () => {
      window.removeEventListener('ask-ai', handleAskAi as EventListener);
    };
  }, [sendMessage, answerMode]);
};

