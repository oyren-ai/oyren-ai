import React, { createContext, useContext, useMemo } from 'react';
import type { AnswerMode, PendingImage, PreviewImage, ChatMessage } from '../types';
import type { MentionedFile } from '../hooks/useFileMention';
import type { WorkspaceFile } from '@/types/workspace';
import type { AiModel } from '@/types/aiProviderKey';

// Grouped state interfaces
export interface AiChatUIState {
  inputValue: string;
  answerMode: AnswerMode;
  pendingImages: PendingImage[];
  expandedReasoning: Set<string>;
  previewImage: PreviewImage | null;
  showMentionPopup: boolean;
  mentionSearchQuery: string;
  selectedFiles: MentionedFile[];
  mentionFiles: WorkspaceFile[];
  contextFiles: MentionedFile[];
  convertingFileId: string | null;
}

export interface AiChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  isLoadingConversation: boolean;
  aiError: string | null;
  hasApiKey: boolean;
  totalTokens: number;
  inputTokens?: number;
  outputTokens?: number;
  pdfPath: string | null;
  workspaceId?: string;
}

export interface AiChatModelState {
  currentProvider: string | null;
  currentModel: string;
  availableModels: AiModel[];
}

export interface AiChatActions {
  onInputChange: (value: string) => void;
  onSend: () => void;
  onCancelRequest: () => void;
  onNewChat: () => void;
  onLoadConversation: (conversationId: string) => Promise<void>;
  onAnswerModeChange: (mode: AnswerMode) => void;
  onToggleReasoning: (messageId: string) => void;
  onRetryUserMessage: (message: any) => void;
  onRetryErrorMessage: (message: any) => void;
  onRemoveImage: (index: number) => void;
  onImagePreview: (data: string, name: string, size: { width: number; height: number }) => void;
  onClosePreview: () => void;
  onOpenSettings: () => void;
  onModelChange: (model: string) => void;
}

export interface AiChatMentionActions {
  onSelectFile: (file: WorkspaceFile) => void;
  onRemoveFile: (fileId: string) => void;
  onCloseMentionPopup: () => void;
  onCheckMention: (value: string, cursorPosition: number) => void;
  onConvertPdfFromMention: (file: WorkspaceFile) => void;
}

export interface AiChatContextValue {
  uiState: AiChatUIState;
  chatState: AiChatState;
  modelState: AiChatModelState;
  actions: AiChatActions;
  mentionActions: AiChatMentionActions;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

export interface AiChatProviderProps {
  value: AiChatContextValue;
  children: React.ReactNode;
}

export const AiChatProvider: React.FC<AiChatProviderProps> = ({ value, children }) => {
  // Memoize the entire context value to prevent unnecessary rerenders
  const memoizedValue = useMemo(() => value, [
    // UI State
    value.uiState.inputValue,
    value.uiState.answerMode,
    value.uiState.pendingImages,
    value.uiState.expandedReasoning,
    value.uiState.previewImage,
    value.uiState.showMentionPopup,
    value.uiState.mentionSearchQuery,
    value.uiState.selectedFiles,
    value.uiState.mentionFiles,
    value.uiState.contextFiles,
    value.uiState.convertingFileId,
    // Chat State
    value.chatState.messages,
    value.chatState.isLoading,
    value.chatState.isLoadingHistory,
    value.chatState.isLoadingConversation,
    value.chatState.aiError,
    value.chatState.hasApiKey,
    value.chatState.totalTokens,
    value.chatState.inputTokens,
    value.chatState.outputTokens,
    value.chatState.pdfPath,
    value.chatState.workspaceId,
    // Model State
    value.modelState.currentProvider,
    value.modelState.currentModel,
    value.modelState.availableModels,
    // Actions (should be stable via useCallback)
    value.actions,
    value.mentionActions,
  ]);

  return (
    <AiChatContext.Provider value={memoizedValue}>
      {children}
    </AiChatContext.Provider>
  );
};

export const useAiChatContext = (): AiChatContextValue => {
  const context = useContext(AiChatContext);
  if (!context) {
    throw new Error('useAiChatContext must be used within AiChatProvider');
  }
  return context;
};

