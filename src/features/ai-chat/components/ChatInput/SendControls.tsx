import React from 'react';
import { Send, Square } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { AnswerMode } from '../../types';

interface SendControlsProps {
  answerMode: AnswerMode;
  onAnswerModeChange: (mode: AnswerMode) => void;
  onSend: () => void;
  onCancelRequest?: () => void;
  isLoading: boolean;
  canSend: boolean;
  showOnlyAnswerMode?: boolean;
  showOnlySendButton?: boolean;
}

export default function SendControls({
  answerMode,
  onAnswerModeChange,
  onSend,
  onCancelRequest,
  isLoading,
  canSend,
  showOnlyAnswerMode = false,
  showOnlySendButton = false
}: SendControlsProps) {
  const getAnswerModeLabel = (mode: AnswerMode) => {
    switch (mode) {
      case 'short':
        return 'Short';
      case 'concise':
        return 'Concise';
      case 'detailed':
        return 'Detailed';
      default:
        return 'Answer mode';
    }
  };

  const currentLabel = getAnswerModeLabel(answerMode);

  return (
    <>
      {/* Answer Mode Select */}
      {!showOnlySendButton && (
        <Select value={answerMode} onValueChange={onAnswerModeChange} disabled={isLoading}>
          <SelectTrigger
            className="h-7 px-3 text-xs rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-colors w-auto min-w-[90px]"
            data-testid="answer-mode-button"
          >
            <span className="font-medium whitespace-nowrap">{currentLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short">
              <div className="flex flex-col">
                <span className="font-medium">Short</span>
                <span className="text-xs text-muted-foreground">50-100 words</span>
              </div>
            </SelectItem>
            <SelectItem value="concise">
              <div className="flex flex-col">
                <span className="font-medium">Concise</span>
                <span className="text-xs text-muted-foreground">150-200 words</span>
              </div>
            </SelectItem>
            <SelectItem value="detailed">
              <div className="flex flex-col">
                <span className="font-medium">Detailed</span>
                <span className="text-xs text-muted-foreground">500-600 words</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Send/Stop Button */}
      {!showOnlyAnswerMode && (
        isLoading ? (
          <Button
            onClick={onCancelRequest}
            size="icon"
            className="h-7 w-7 rounded-full bg-red-500 text-white hover:bg-red-600"
            data-testid="stop-btn"
            title="Stop generation"
            aria-label="Stop"
          >
            <Square className="w-4 h-4" fill="currentColor" />
          </Button>
        ) : (
          <Button
            onClick={onSend}
            disabled={!canSend}
            size="icon"
            className="h-7 w-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"
            data-testid="send-btn"
            title="Send message"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </Button>
        )
      )}
    </>
  );
}
