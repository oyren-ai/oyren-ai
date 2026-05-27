import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MentionedFile } from '../../hooks/useFileMention';

interface SelectedFilesSectionProps {
  selectedFiles: MentionedFile[];
  onRemoveFile: (fileId: string) => void;
}

export default function SelectedFilesSection({
  selectedFiles,
  onRemoveFile
}: SelectedFilesSectionProps) {
  return (
    <div className="mb-2 p-2 bg-muted/50 rounded-lg border border-border">
      <div className="flex flex-wrap gap-1.5">
        {selectedFiles.map((file) => (
          <Badge
            key={file.id}
            variant="secondary"
            className="inline-flex items-center gap-1 px-2 py-1"
          >
            {file.name}
            <button
              onClick={() => onRemoveFile(file.id)}
              className="hover:bg-secondary-foreground/10 rounded-sm transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
