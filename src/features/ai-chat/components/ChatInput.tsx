import React from 'react';
import PendingImagesSection from './ChatInput/PendingImagesSection';
import SelectedFilesSection from './ChatInput/SelectedFilesSection';
import MessageTextarea from './ChatInput/MessageTextarea';
import ModelSelector from './ChatInput/ModelSelector';
import SendControls from './ChatInput/SendControls';
import { useAiChatInputModel } from '../context/useAiChatInputModel';

export default function ChatInput({ 'data-testid': testId }: { 'data-testid'?: string }) {
  const model = useAiChatInputModel();
  const canSend = model.value.trim().length > 0 || model.pendingImages.length > 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-3 z-20" data-testid={testId}>
      <div className="bg-background/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm overflow-visible">
        <div className="p-3 relative">
          {model.pendingImages.length > 0 && (
            <PendingImagesSection
              pendingImages={model.pendingImages}
              onRemoveImage={model.onRemoveImage}
              onImagePreview={model.onImagePreview}
            />
          )}

          {model.selectedFiles.length > 0 && (
            <SelectedFilesSection
              selectedFiles={model.selectedFiles}
              onRemoveFile={model.onRemoveFile}
            />
          )}

          <div className="mb-0 relative">
            <MessageTextarea
              value={model.value}
              onChange={model.onChange}
              onSend={model.onSend}
              isLoading={model.isLoading}
              pendingImagesCount={model.pendingImages.length}
              showMentionPopup={model.showMentionPopup}
              mentionFiles={model.mentionFiles}
              selectedFiles={model.selectedFiles}
              mentionSearchQuery={model.mentionSearchQuery}
              currentPdfPath={model.currentPdfPath}
              onSelectFile={model.onSelectFile}
              onCloseMentionPopup={model.onCloseMentionPopup}
              onCheckMention={model.onCheckMention}
              onConvertPdfFromMention={model.onConvertPdfFromMention}
              convertingFileId={model.convertingFileId}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <ModelSelector
                currentProvider={model.currentProvider}
                currentModel={model.currentModel}
                onModelChange={model.onModelChange}
                availableModels={model.availableModels}
                isLoading={model.isLoading}
              />
              <SendControls
                answerMode={model.answerMode}
                onAnswerModeChange={model.onAnswerModeChange}
                onSend={model.onSend}
                onCancelRequest={model.onCancelRequest}
                isLoading={model.isLoading}
                canSend={canSend}
                showOnlyAnswerMode={true}
              />
            </div>
            <SendControls
              answerMode={model.answerMode}
              onAnswerModeChange={model.onAnswerModeChange}
              onSend={model.onSend}
              onCancelRequest={model.onCancelRequest}
              isLoading={model.isLoading}
              canSend={canSend}
              showOnlySendButton={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
