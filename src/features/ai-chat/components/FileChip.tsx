import React from 'react';
import { FileText, X } from 'lucide-react';

export interface FileChipProps {
  fileName: string;
  filePath: string;
  onRemove?: () => void;
  'data-testid'?: string;
}

const FileChip: React.FC<FileChipProps> = ({
  fileName,
  filePath,
  onRemove,
  'data-testid': testId
}) => {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-xs group hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
      data-testid={testId}
    >
      <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <span
        className="text-blue-700 dark:text-blue-300 max-w-[120px] truncate"
        title={fileName}
      >
        {fileName}
      </span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Remove ${fileName}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default FileChip;
