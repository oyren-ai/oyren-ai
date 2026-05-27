import React from 'react';
import { FileText, FileCode, Check, FileOutput } from 'lucide-react';
import type { WorkspaceFile } from '@/types/workspace';

function isMarkdownFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.md');
}

function isPdfFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.pdf');
}

interface FileMentionPopupProps {
  files: WorkspaceFile[];
  searchQuery: string;
  selectedFileIds: string[];
  currentPdfPath: string | null;
  onSelect: (file: WorkspaceFile) => void;
  onClose: () => void;
  /** Called when user clicks convert button – e.g. to open explanatory modal. If not set, falls back to onConvertPdf. */
  onConvertClick?: (file: WorkspaceFile) => void;
  /** Called to start conversion directly (used when no modal; e.g. tests). */
  onConvertPdf?: (file: WorkspaceFile) => void;
  convertingFileId?: string | null;
}

const FileMentionPopup: React.FC<FileMentionPopupProps> = ({
  files,
  searchQuery,
  selectedFileIds,
  currentPdfPath,
  onSelect,
  onConvertClick,
  onConvertPdf,
  convertingFileId,
}) => {
  const handleConvertClick = (e: React.MouseEvent, file: WorkspaceFile) => {
    e.stopPropagation();
    if (convertingFileId === file.id) return;
    if (onConvertClick) onConvertClick(file);
    else if (onConvertPdf) onConvertPdf(file);
  };
  const filteredFiles = files.filter(file =>
    file.file_name.toLowerCase().includes(searchQuery)
  );

  if (filteredFiles.length === 0) {
    return (
      <div className="absolute bottom-full mb-2 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg z-50 p-3">
        <p className="text-sm text-muted-foreground">
          {files.length === 0 ? 'No files in workspace' : 'No matching files'}
        </p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
      <div className="px-3 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
        <p className="text-xs text-muted-foreground font-medium">
          Select file to mention
        </p>
      </div>
      <div className="p-1">
        {filteredFiles.map((file) => {
          const isSelected = selectedFileIds.includes(file.id);
          const isCurrent = file.file_path === currentPdfPath;
          const isMarkdown = isMarkdownFile(file.file_name);
          const isPdf = isPdfFile(file.file_name);
          const isConverting = convertingFileId === file.id;

          return (
            <div
              key={file.id}
              className={`rounded-md flex items-center gap-2 ${
                isSelected ? 'bg-primary/10' : 'hover:bg-accent'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(file)}
                className={`flex-1 min-w-0 text-left px-2 py-1.5 transition-colors flex items-center gap-2 ${
                  isSelected ? 'text-primary' : 'text-foreground'
                }`}
              >
                {isMarkdown ? (
                  <FileCode className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-primary/80'}`} aria-label="Markdown" />
                ) : (
                  <FileText className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm truncate ${isSelected ? 'font-medium' : ''}`}>
                      {file.file_name}
                    </span>
                    {isMarkdown && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">
                        Markdown
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        Current
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
              {isPdf && (onConvertClick || onConvertPdf) && (
                <button
                  type="button"
                  onClick={(e) => handleConvertClick(e, file)}
                  disabled={isConverting}
                  className="shrink-0 mr-1.5 px-2 py-1 text-[10px] font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-1"
                  title="Convert to Markdown"
                >
                  {isConverting ? '…' : (
                    <>
                      <FileOutput className="w-3.5 h-3.5" aria-hidden />
                      <span>Convert</span>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileMentionPopup;
