import { useMemo } from 'react';
import { useAiChatContext } from './AiChatContext';

export interface AiChatHeaderModel {
  hasApiKey: boolean;
  totalTokens: number;
  inputTokens?: number;
  outputTokens?: number;
  aiError: string | null;
  contextFiles: any[];
  workspaceId?: string;
  onNewChat: () => void;
  onLoadConversation: (conversationId: string) => Promise<void>;
  onOpenSettings: () => void;
}

export const useAiChatHeaderModel = (): AiChatHeaderModel => {
  const { chatState, uiState, actions } = useAiChatContext();

  return useMemo(
    () => ({
      hasApiKey: chatState.hasApiKey,
      totalTokens: chatState.totalTokens,
      inputTokens: chatState.inputTokens,
      outputTokens: chatState.outputTokens,
      aiError: chatState.aiError,
      contextFiles: uiState.contextFiles,
      workspaceId: chatState.workspaceId,
      onNewChat: actions.onNewChat,
      onLoadConversation: actions.onLoadConversation,
      onOpenSettings: actions.onOpenSettings,
    }),
    [
      chatState.hasApiKey,
      chatState.totalTokens,
      chatState.inputTokens,
      chatState.outputTokens,
      chatState.aiError,
      chatState.workspaceId,
      uiState.contextFiles,
      actions.onNewChat,
      actions.onLoadConversation,
      actions.onOpenSettings,
    ]
  );
};

