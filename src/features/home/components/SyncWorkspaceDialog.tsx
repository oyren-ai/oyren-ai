import React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowUpFromLine,
  ArrowDownToLine,
  Link2,
  Minus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCloudSyncModal } from '@/contexts/ModalContext';
import { useSyncWorkspace } from '@/features/workspace-management/hooks/useSyncWorkspace';
import type { WorkspaceDisplay } from '@/types/workspace';

interface SyncWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SyncWorkspaceDialog({ isOpen, onClose }: SyncWorkspaceDialogProps) {
  const cloudSyncModal = useCloudSyncModal();
  const workspace = cloudSyncModal.data?.workspace as WorkspaceDisplay | undefined;
  const { sync, status, progress, reset } = useSyncWorkspace();
  const isRunning = status === 'syncing' || status === 'resolving' || status === 'comparing';

  function handleClose() {
    if (isRunning) return;
    reset();
    onClose();
  }

  async function handleStart() {
    if (!workspace) return;
    await sync(workspace);
  }

  const progressPercent =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  const hasErrors = progress.errors.length > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isRunning) handleClose();
      }}
    >
      <DialogContent
        className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto overflow-x-hidden"
        data-testid="sync-workspace-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Sync with cloud
          </DialogTitle>
          {workspace && (
            <DialogDescription>
              <span className="font-medium text-foreground">{workspace.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                — manual only; chats excluded
              </span>
            </DialogDescription>
          )}
        </DialogHeader>

        {status === 'idle' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Only <span className="font-medium text-foreground">missing</span> files are added: local-only
              files upload to the web workspace, cloud-only files download here. Files that already match are
              left unchanged. Nothing is deleted on either side.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleStart} data-testid="sync-start-button">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync now
              </Button>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span className="truncate">
                {progress.currentFile ? `${progress.phase} ${progress.currentFile}` : progress.phase || 'Preparing…'}
              </span>
            </div>
            {progress.total > 0 && (
              <>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {progress.completed} / {progress.total} steps
                </p>
              </>
            )}
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="min-w-0 w-full space-y-4">
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">Sync completed</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <StatBadge icon={<ArrowUpFromLine className="w-3.5 h-3.5" />} label="Uploaded" value={progress.uploaded} />
                <StatBadge icon={<ArrowDownToLine className="w-3.5 h-3.5" />} label="Downloaded" value={progress.downloaded} />
                <StatBadge icon={<Link2 className="w-3.5 h-3.5" />} label="Linked" value={progress.linked} />
                <StatBadge icon={<Minus className="w-3.5 h-3.5" />} label="Unchanged" value={progress.skipped} />
              </div>

              {hasErrors && (
                <ErrorPanel errors={progress.errors} />
              )}
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" onClick={handleClose} data-testid="sync-done-button">
                Done
              </Button>
            </DialogFooter>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="min-w-0 w-full space-y-4">
              <div className="flex items-start gap-2 text-destructive">
                <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">Sync failed</p>
                  {progress.errors.map((e, i) => (
                    <p
                      key={i}
                      className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere]"
                    >
                      {e.file ? `${e.file}: ` : ''}{e.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Close
              </Button>
              <Button
                type="button"
                onClick={() => { reset(); void handleStart(); }}
                data-testid="sync-retry-button"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-border/60 bg-muted/40 p-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

interface ErrorPanelProps {
  errors: { file: string; message: string }[];
}

function ErrorPanel({ errors }: ErrorPanelProps) {
  return (
    <div className="rounded-md border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        {errors.length} file{errors.length !== 1 ? 's' : ''} failed
      </div>
      <ul className="list-none space-y-2 m-0 p-0">
        {errors.map((e, i) => (
          <li
            key={i}
            className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere] border-l-2 border-yellow-300/60 dark:border-yellow-700/50 pl-2"
          >
            {e.file && <span className="font-medium text-foreground/80">{e.file}: </span>}
            {e.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
