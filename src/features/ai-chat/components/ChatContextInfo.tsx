import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, Coins } from 'lucide-react';
import FileChip from './FileChip';
import type { MentionedFile } from '../hooks/useFileMention';

export interface ChatContextInfoProps {
  totalTokens: number;
  inputTokens?: number;
  outputTokens?: number;
  contextFiles: MentionedFile[];
  'data-testid'?: string;
}

const ChatContextInfo: React.FC<ChatContextInfoProps> = ({
  totalTokens,
  inputTokens,
  outputTokens,
  contextFiles,
  'data-testid': testId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update popover position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [isOpen]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors shrink-0"
        title="Chat context info"
        data-testid={testId || "context-info-button"}
      >
        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          className="fixed w-56 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50"
          style={{ top: position.top, left: position.left }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          data-testid="context-info-popover"
        >
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Chat Context
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Coins className="w-3.5 h-3.5" />
                <span>Total tokens</span>
              </div>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {totalTokens.toLocaleString()}
              </span>
            </div>

            {/* Token breakdown */}
            {(inputTokens !== undefined || outputTokens !== undefined) && (
              <div className="pl-5 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                {inputTokens !== undefined && (
                  <div className="flex justify-between">
                    <span>Input:</span>
                    <span>{inputTokens.toLocaleString()}</span>
                  </div>
                )}
                {outputTokens !== undefined && (
                  <div className="flex justify-between">
                    <span>Output:</span>
                    <span>{outputTokens.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Files in context */}
            {contextFiles.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Files in context ({contextFiles.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {contextFiles.map((file) => (
                    <FileChip
                      key={file.id}
                      fileName={file.name}
                      filePath={file.path}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ChatContextInfo;
