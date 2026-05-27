import React from 'react';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { WorkspaceFile } from '@/types/workspace';

interface ConvertToMarkdownModalProps {
  open: boolean;
  file: WorkspaceFile | null;
  onClose: () => void;
  onConfirm: (file: WorkspaceFile) => void;
}

export default function ConvertToMarkdownModal({
  open,
  file,
  onClose,
  onConfirm,
}: ConvertToMarkdownModalProps) {
  const handleConfirm = () => {
    if (file) {
      onConfirm(file);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[min(28rem,calc(100vw-2rem))] max-w-[min(28rem,calc(100vw-2rem))] max-h-[90vh] overflow-y-auto border-border"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-lg">More accurate AI context</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="space-y-2 pt-1 text-left">
              <p className="text-sm text-muted-foreground">
                This is a <strong>Pro</strong> feature: We convert the PDF file to structured Markdown so that AI can better understand tables, headers, and text structure.
              </p>
              <p className="text-sm text-muted-foreground">
                After conversion, your questions will get more accurate answers and AI will use the content more effectively.
              </p>
              {file && (
                <p className="text-xs text-muted-foreground pt-1 truncate" title={file.file_name}>
                  File: <span className="font-medium text-foreground">{file.file_name}</span>
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!file}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Convert to Markdown
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
