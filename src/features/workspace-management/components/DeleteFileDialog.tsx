import React, { useState } from 'react';
import type { WorkspaceFile } from '@/types/workspace';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Cloud } from 'lucide-react';

interface DeleteFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: WorkspaceFile | null;
  onConfirm: (file: WorkspaceFile) => Promise<void>;
}

export function DeleteFileDialog({
  isOpen,
  onClose,
  file,
  onConfirm,
}: DeleteFileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSynced = Boolean(file?.sync_id);

  const handleDelete = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(file);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) { setError(null); onClose(); }
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[440px] dark:bg-neutral-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove from local
          </DialogTitle>
          <DialogDescription>
            Remove <span className="font-medium text-foreground">&ldquo;{file.file_name}&rdquo;</span> from this workspace?
          </DialogDescription>
        </DialogHeader>

        {isSynced ? (
          <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-2.5 flex items-start gap-2">
            <Cloud className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              This file is synced with the cloud. The local copy will be removed but the{' '}
              <span className="font-medium">cloud version stays intact</span> — you can restore it anytime.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This file is not synced to the cloud. It will be permanently removed from disk.
          </p>
        )}

        {error && <div className="text-sm text-destructive">{error}</div>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Removing…' : isSynced ? 'Remove local copy' : 'Remove File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


