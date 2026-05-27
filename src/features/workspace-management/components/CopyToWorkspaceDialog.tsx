import React, { useState, useEffect } from 'react';
import type { WorkspaceFile, Workspace } from '@/types/workspace';
import { workspaceApi } from '@/api/workspaceApi';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyToWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: WorkspaceFile | null;
  currentWorkspaceId: string | undefined;
}

export function CopyToWorkspaceDialog({
  isOpen, onClose, file, currentWorkspaceId,
}: CopyToWorkspaceDialogProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedId(null);
    setError(null);
    workspaceApi.list().then((all) => {
      setWorkspaces(all.filter((w) => w.id !== currentWorkspaceId));
    });
  }, [isOpen, currentWorkspaceId]);

  const handleCopy = async () => {
    if (!file || !selectedId) return;
    setLoading(true);
    setError(null);
    try {
      await workspaceFilesApi.copyFile(file.id, selectedId);
      window.dispatchEvent(new CustomEvent('workspace-files-changed'));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy file');
    } finally {
      setLoading(false);
    }
  };

  if (!file) return null;

  const maxLength = 35;
  const displayName = file.file_name.length > maxLength
    ? `${file.file_name.slice(0, maxLength)}…`
    : file.file_name;

  return (
    <Dialog open={isOpen} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="sm:max-w-[425px] dark:bg-neutral-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copy to Workspace
          </DialogTitle>
          <DialogDescription title={file.file_name}>
            Copy &quot;{displayName}&quot; to another workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {workspaces.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No other workspaces available</p>
          ) : (
            workspaces.map((ws) => (
              <button key={ws.id} type="button" onClick={() => setSelectedId(ws.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  selectedId === ws.id
                    ? "bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-100"
                    : "hover:bg-accent"
                )}>
                {ws.name}
              </button>
            ))
          )}
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleCopy} disabled={loading || !selectedId}>
            {loading ? 'Copying...' : 'Copy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
