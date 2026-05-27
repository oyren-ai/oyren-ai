import { useMemo } from 'react';
import { useAiChatContext } from './AiChatContext';
import type { AnswerMode, PendingImage } from '../types';
import type { MentionedFile } from '../hooks/useFileMention';
import type { WorkspaceFile } from '@/types/workspace';
import type { AiModel } from '@/types/aiProviderKey';

export interface AiChatInputModel {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancelRequest: () => void;
  isLoading: boolean;
  pendingImages: PendingImage[];
  onRemoveImage: (index: number) => void;
  onImagePreview: (data: string, name: string, size: { width: number; height: number }) => void;
  answerMode: AnswerMode;
  onAnswerModeChange: (mode: AnswerMode) => void;
  currentProvider: string | null;
  currentModel: string;
  onModelChange: (model: string) => void;
  availableModels: AiModel[];
  showMentionPopup: boolean;
  mentionFiles: WorkspaceFile[];
  selectedFiles: MentionedFile[];
  mentionSearchQuery: string;
  currentPdfPath: string | null;
  onSelectFile: (file: WorkspaceFile) => void;
  onRemoveFile: (fileId: string) => void;
  onCloseMentionPopup: () => void;
  onCheckMention: (value: string, cursorPosition: number) => void;
  onConvertPdfFromMention: (file: WorkspaceFile) => void;
  convertingFileId: string | null;
}

export const useAiChatInputModel = (): AiChatInputModel => {
  const { chatState, uiState, modelState, actions, mentionActions } = useAiChatContext();

  return useMemo(
    () => ({
      value: uiState.inputValue,
      onChange: actions.onInputChange,
      onSend: actions.onSend,
      onCancelRequest: actions.onCancelRequest,
      isLoading: chatState.isLoading,
      pendingImages: uiState.pendingImages,
      onRemoveImage: actions.onRemoveImage,
      onImagePreview: actions.onImagePreview,
      answerMode: uiState.answerMode,
      onAnswerModeChange: actions.onAnswerModeChange,
      currentProvider: modelState.currentProvider,
      currentModel: modelState.currentModel,
      onModelChange: actions.onModelChange,
      availableModels: modelState.availableModels,
      showMentionPopup: uiState.showMentionPopup,
      mentionFiles: uiState.mentionFiles,
      selectedFiles: uiState.selectedFiles,
      mentionSearchQuery: uiState.mentionSearchQuery,
      currentPdfPath: chatState.pdfPath,
      onSelectFile: mentionActions.onSelectFile,
      onRemoveFile: mentionActions.onRemoveFile,
      onCloseMentionPopup: mentionActions.onCloseMentionPopup,
      onCheckMention: mentionActions.onCheckMention,
      onConvertPdfFromMention: mentionActions.onConvertPdfFromMention,
      convertingFileId: uiState.convertingFileId,
    }),
    [
      uiState.inputValue,
      uiState.pendingImages,
      uiState.answerMode,
      uiState.showMentionPopup,
      uiState.mentionFiles,
      uiState.selectedFiles,
      uiState.mentionSearchQuery,
      uiState.convertingFileId,
      chatState.isLoading,
      chatState.pdfPath,
      modelState.currentProvider,
      modelState.currentModel,
      modelState.availableModels,
      actions.onInputChange,
      actions.onSend,
      actions.onCancelRequest,
      actions.onRemoveImage,
      actions.onImagePreview,
      actions.onAnswerModeChange,
      actions.onModelChange,
      mentionActions.onSelectFile,
      mentionActions.onRemoveFile,
      mentionActions.onCloseMentionPopup,
      mentionActions.onCheckMention,
      mentionActions.onConvertPdfFromMention,
    ]
  );
};

