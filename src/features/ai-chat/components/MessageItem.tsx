import React from 'react';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import type { ChatMessage } from '../types';
import type { ArxivPaperMeta } from '@/api/types/ai';

interface MessageItemProps {
  message: ChatMessage;
  isReasoningExpanded: boolean;
  onToggleReasoning: () => void;
  onRetryUser: () => void;
  onRetryError: () => void;
  onImagePreview: (data: string, name: string, size: { width: number; height: number }) => void;
  onSavePaper?: (paper: ArxivPaperMeta) => void;
  savingPaperId?: string | null;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message, isReasoningExpanded, onToggleReasoning,
  onRetryUser, onRetryError, onImagePreview, onSavePaper, savingPaperId,
}) => {
  return (
    <div className="max-w-4xl mx-auto min-w-0 w-full px-4 py-3" data-testid={`message-${message.id}`}>
      {message.type === 'user' ? (
        <UserMessage message={message} onImagePreview={onImagePreview} />
      ) : (
        <AssistantMessage
          message={message}
          isReasoningExpanded={isReasoningExpanded}
          onToggleReasoning={onToggleReasoning}
          onRetryError={onRetryError}
          onImagePreview={onImagePreview}
          onSavePaper={onSavePaper}
          savingPaperId={savingPaperId}
        />
      )}
    </div>
  );
};

export default MessageItem;
