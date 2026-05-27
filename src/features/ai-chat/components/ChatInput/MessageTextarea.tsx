import React, { useRef, useEffect, useState } from 'react';
import FileMentionPopup from '../FileMentionPopup';
import ConvertToMarkdownModal from './ConvertToMarkdownModal';
import type { WorkspaceFile } from '@/types/workspace';
import type { MentionedFile } from '../../hooks/useFileMention';

interface MessageTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  pendingImagesCount: number;
  showMentionPopup: boolean;
  mentionFiles: WorkspaceFile[];
  selectedFiles: MentionedFile[];
  mentionSearchQuery: string;
  currentPdfPath: string | null;
  onSelectFile: (file: WorkspaceFile) => void;
  onCloseMentionPopup: () => void;
  onCheckMention: (value: string, cursorPosition: number) => void;
  onConvertPdfFromMention?: (file: WorkspaceFile) => void;
  convertingFileId?: string | null;
}

export default function MessageTextarea({
  value,
  onChange,
  onSend,
  isLoading,
  pendingImagesCount,
  showMentionPopup,
  mentionFiles,
  selectedFiles,
  mentionSearchQuery,
  currentPdfPath,
  onSelectFile,
  onCloseMentionPopup,
  onCheckMention,
  onConvertPdfFromMention,
  convertingFileId,
}: MessageTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionWasOpenRef = useRef<boolean>(showMentionPopup);
  const [convertModalFile, setConvertModalFile] = useState<WorkspaceFile | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, window.innerHeight * 0.5);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  // Restore focus after closing mention popup
  useEffect(() => {
    if (mentionWasOpenRef.current && !showMentionPopup) {
      textareaRef.current?.focus();
    }
    mentionWasOpenRef.current = showMentionPopup;
  }, [showMentionPopup]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSelectFile = (file: WorkspaceFile) => {
    onSelectFile(file);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <>
      {showMentionPopup && (
        <FileMentionPopup
          files={mentionFiles}
          searchQuery={mentionSearchQuery}
          selectedFileIds={selectedFiles.map(f => f.id)}
          currentPdfPath={currentPdfPath}
          onSelect={handleSelectFile}
          onClose={onCloseMentionPopup}
          onConvertClick={onConvertPdfFromMention ? (file) => setConvertModalFile(file) : undefined}
          onConvertPdf={onConvertPdfFromMention}
          convertingFileId={convertingFileId ?? null}
        />
      )}
      <ConvertToMarkdownModal
        open={!!convertModalFile}
        file={convertModalFile}
        onClose={() => setConvertModalFile(null)}
        onConfirm={(file) => {
          onConvertPdfFromMention?.(file);
          setConvertModalFile(null);
        }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onCheckMention(e.target.value, e.target.selectionStart);
        }}
        placeholder={pendingImagesCount > 0 ? "Ask about these images..." : "Type @ to mention files..."}
        disabled={isLoading}
        className="w-full min-h-12 max-h-24 resize-none border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none outline-none text-sm leading-snug px-2 py-2"
        onKeyDown={handleKeyDown}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        data-testid="message-input"
      />
    </>
  );
}
