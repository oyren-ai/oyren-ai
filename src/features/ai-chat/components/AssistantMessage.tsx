import React from 'react';
import MessageContent from './MessageContent';
import MessageErrorBlock from './MessageErrorBlock';
import ArxivPapersList from './ArxivPapersList';
import { AssistantImages, TokenInfo, ReasoningBlock, RetryButton } from './AssistantMessageParts';
import { useArxivPapersFromMessage } from '../hooks/useArxivPapersFromMessage';
import type { ChatMessage } from '../types';
import type { ArxivPaperMeta } from '@/api/types/ai';

interface AssistantMessageProps {
  message: ChatMessage;
  isReasoningExpanded: boolean;
  onToggleReasoning: () => void;
  onRetryError: () => void;
  onImagePreview: (data: string, name: string, size: { width: number; height: number }) => void;
  onSavePaper?: (paper: ArxivPaperMeta) => void;
  savingPaperId?: string | null;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
  message, isReasoningExpanded, onToggleReasoning, onRetryError,
  onImagePreview, onSavePaper, savingPaperId,
}) => {
  const isError = message.isError === true;
  const hasReasoning = message.reasoning;
  const { displayContent, arxivPapers } = useArxivPapersFromMessage(message);

  return (
    <div className="flex justify-start">
      <div className="space-y-2 max-w-full min-w-0 w-full">
        <span className="block text-xs font-semibold text-purple-600 mb-1" data-testid="ai-label">AI</span>

        {isError && <MessageErrorBlock content={message.content} structuredError={message.structuredError} />}

        {message.sourceText && (
          <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded text-sm">
            <strong>Selected text:</strong> "{message.sourceText}"
          </div>
        )}

        <AssistantImages message={message} onImagePreview={onImagePreview} />

        {!isError && (
          <div className="inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed">
            <div className="whitespace-pre-wrap break-words prose prose-sm max-w-none dark:prose-invert">
              <MessageContent content={displayContent} type={message.type} messageId={message.id} />
            </div>
          </div>
        )}

        {!isError && arxivPapers.length > 0 && (
          <div className="px-4">
            <ArxivPapersList papers={arxivPapers} onSavePaper={onSavePaper} savingPaperId={savingPaperId} />
          </div>
        )}

        <TokenInfo message={message} isError={isError} />
        {hasReasoning && <ReasoningBlock message={message} isExpanded={isReasoningExpanded} onToggle={onToggleReasoning} />}
        {isError && <RetryButton onRetry={onRetryError} />}
      </div>
    </div>
  );
};

export default AssistantMessage;
