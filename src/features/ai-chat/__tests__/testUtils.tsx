import React from 'react';
import { AiChatProvider, AiChatContextValue } from '../context/AiChatContext';
import type { AnswerMode } from '../types';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const createMockContextValue = (overrides?: DeepPartial<AiChatContextValue>): AiChatContextValue => {
  const defaultValue: AiChatContextValue = {
    uiState: {
      inputValue: '',
      answerMode: 'concise' as AnswerMode,
      pendingImages: [],
      expandedReasoning: new Set(),
      previewImage: null,
      showMentionPopup: false,
      mentionSearchQuery: '',
      selectedFiles: [],
      mentionFiles: [],
      contextFiles: [],
    },
    chatState: {
      messages: [],
      isLoading: false,
      isLoadingHistory: false,
      isLoadingConversation: false,
      aiError: null,
      hasApiKey: true,
      totalTokens: 0,
      inputTokens: undefined,
      outputTokens: undefined,
      pdfPath: null,
      workspaceId: undefined,
    },
    modelState: {
      currentProvider: null,
      currentModel: '',
      availableModels: [],
    },
    actions: {
      onInputChange: () => {},
      onSend: () => {},
      onCancelRequest: () => {},
      onNewChat: () => {},
      onLoadConversation: async () => {},
      onAnswerModeChange: () => {},
      onToggleReasoning: () => {},
      onRetryUserMessage: () => {},
      onRetryErrorMessage: () => {},
      onRemoveImage: () => {},
      onImagePreview: () => {},
      onClosePreview: () => {},
      onOpenSettings: () => {},
      onModelChange: () => {},
    },
    mentionActions: {
      onSelectFile: () => {},
      onRemoveFile: () => {},
      onCloseMentionPopup: () => {},
      onCheckMention: () => {},
    },
  };

  // Deep merge overrides - properly handle arrays
  const mergeState = <T extends Record<string, any>>(defaults: T, overrides?: DeepPartial<T>): T => {
    if (!overrides) return defaults;
    const result = { ...defaults } as T;
    for (const key in overrides) {
      const override = overrides[key];
      if (override !== undefined) {
        if (override instanceof Set) {
          // Preserve Set instances
          result[key] = override as any;
        } else if (Array.isArray(override) && override.length > 0 && override[0] !== undefined) {
          result[key] = override as any;
        } else if (typeof override === 'function') {
          result[key] = override as any;
        } else if (override !== null && typeof override === 'object' && !Array.isArray(override)) {
          result[key] = { ...defaults[key], ...override } as any;
        } else {
          result[key] = override as any;
        }
      }
    }
    return result;
  };

  return {
    uiState: mergeState(defaultValue.uiState, overrides?.uiState),
    chatState: mergeState(defaultValue.chatState, overrides?.chatState),
    modelState: mergeState(defaultValue.modelState, overrides?.modelState),
    actions: mergeState(defaultValue.actions, overrides?.actions),
    mentionActions: mergeState(defaultValue.mentionActions, overrides?.mentionActions),
  };
};

export interface MockContextProviderProps {
  value?: DeepPartial<AiChatContextValue>;
  children: React.ReactNode;
}

export const MockAiChatProvider: React.FC<MockContextProviderProps> = ({ value, children }) => {
  const mockValue = createMockContextValue(value);
  return <AiChatProvider value={mockValue}>{children}</AiChatProvider>;
};

