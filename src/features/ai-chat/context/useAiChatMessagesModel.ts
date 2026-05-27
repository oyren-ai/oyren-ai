import { useMemo } from 'react';
import { useAiChatContext } from './AiChatContext';

export interface AiChatMessagesModel {
  messages: any[];
  isLoading: boolean;
  aiError: string | null;
  isLoadingHistory: boolean;
  isLoadingConversation: boolean;
  expandedReasoning: Set<string>;
  hasApiKey: boolean;
  onToggleReasoning: (messageId: string) => void;
  onRetryUserMessage: (message: any) => void;
  onRetryErrorMessage: (message: any) => void;
  onImagePreview: (data: string, name: string, size: { width: number; height: number }) => void;
}

export const useAiChatMessagesModel = (): AiChatMessagesModel => {
  const { chatState, uiState, actions } = useAiChatContext();

  return useMemo(
    () => ({
      messages: chatState.messages,
      isLoading: chatState.isLoading,
      aiError: chatState.aiError,
      isLoadingHistory: chatState.isLoadingHistory,
      isLoadingConversation: chatState.isLoadingConversation,
      expandedReasoning: uiState.expandedReasoning,
      hasApiKey: chatState.hasApiKey,
      onToggleReasoning: actions.onToggleReasoning,
      onRetryUserMessage: actions.onRetryUserMessage,
      onRetryErrorMessage: actions.onRetryErrorMessage,
      onImagePreview: actions.onImagePreview,
    }),
    [
      chatState.messages,
      chatState.isLoading,
      chatState.aiError,
      chatState.isLoadingHistory,
      chatState.isLoadingConversation,
      chatState.hasApiKey,
      uiState.expandedReasoning,
      actions.onToggleReasoning,
      actions.onRetryUserMessage,
      actions.onRetryErrorMessage,
      actions.onImagePreview,
    ]
  );
};

