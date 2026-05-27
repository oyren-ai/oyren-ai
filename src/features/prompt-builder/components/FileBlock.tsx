import React from 'react';
import { FileText } from 'lucide-react';

interface FileBlockProps {
    fileName?: string;
    onChangeFile: () => void;
}

const FileBlock: React.FC<FileBlockProps> = ({ fileName, onChangeFile }) => (
    <button
        onClick={onChangeFile}
        className="flex items-center gap-1.5 p-2 rounded-md border border-border bg-muted/30
            hover:bg-accent transition-colors w-full text-left"
        data-testid="change-file-btn"
    >
        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs truncate" data-testid="file-block-name">
            {fileName || 'Select file...'}
        </span>
    </button>
);

export default FileBlock;
