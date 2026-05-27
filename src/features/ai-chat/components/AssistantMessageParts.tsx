import React from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MdxRenderer from '@/components/common/MdxRenderer';
import CopyMessageButton from './CopyMessageButton';
import type { ChatMessage } from '../types';

interface AssistantImagesProps {
  message: ChatMessage;
  onImagePreview: (data: string, name: string, size: { width: number; height: number }) => void;
}

export function AssistantImages({ message, onImagePreview }: AssistantImagesProps) {
  if (!message.images || message.images.length === 0) return null;
  return (
    <div className="mb-2 space-y-2">
      {message.images.map((image, index) => (
        <div key={index} className="relative inline-block">
          <img src={image.data} alt={`PDF snippet ${index + 1}`}
            className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ maxHeight: '200px' }} onClick={() => onImagePreview(image.data, `PDF Snippet ${index + 1}`, image)} title="Click to preview" />
          <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">PDF Snippet</div>
        </div>
      ))}
    </div>
  );
}

export function TokenInfo({ message, isError }: { message: ChatMessage; isError: boolean }) {
  if (!message.tokenCount) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-1">
      <span>{message.tokenCount} tokens</span>
      {!isError && <CopyMessageButton content={message.content} />}
    </div>
  );
}

interface ReasoningBlockProps {
  message: ChatMessage;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ReasoningBlock({ message, isExpanded, onToggle }: ReasoningBlockProps) {
  return (
    <div className="mt-2">
      <button onClick={onToggle} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        <span>Show reasoning</span>
      </button>
      {isExpanded && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs text-gray-600 dark:text-gray-400">
          <div className="font-semibold mb-1 text-gray-700 dark:text-gray-300">AI's thought process:</div>
          <MdxRenderer content={message.reasoning!} />
        </div>
      )}
    </div>
  );
}

export function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-2">
      <Button onClick={onRetry} size="sm" variant="default" className="gap-1.5" data-testid="retry-button">
        <RefreshCw className="w-3 h-3" /> Retry
      </Button>
    </div>
  );
}
