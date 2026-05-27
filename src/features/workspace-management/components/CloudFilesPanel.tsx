import React from 'react';
import { Cloud, RotateCcw, Loader2, AlertCircle, CloudOff, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkspaceFile } from '@/types/workspace';
import type { CloudFile } from '@/api/syncApi';
import type { RestoreStatus } from '../hooks/useCloudFileRestore';

interface CloudFilesPanelProps {
  deletedLocalFiles: WorkspaceFile[];
  cloudOnlyFiles: CloudFile[];
  status: RestoreStatus;
  error: string | null;
  onRestore: (params: { localFile?: WorkspaceFile; cloudFile?: CloudFile }) => Promise<void>;
  onRefresh: () => void;
}

/**
 * Panel shown inside the workspace sidebar under a "Cloud" section.
 * Lists files that were deleted locally but still exist in the cloud,
 * and cloud-only files. Each row has a "Restore" button.
 */
export function CloudFilesPanel({
  deletedLocalFiles,
  cloudOnlyFiles,
  status,
  error,
  onRestore,
  onRefresh,
}: CloudFilesPanelProps) {
  const isEmpty = deletedLocalFiles.length === 0 && cloudOnlyFiles.length === 0;

  return (
    <div className="px-2 py-2 space-y-1">
      {status === 'loading' && (
        <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading cloud files…
        </div>
      )}

      {status === 'error' && error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {status !== 'loading' && isEmpty && (
        <div className="flex flex-col items-center gap-1.5 py-6 text-center text-muted-foreground">
          <CloudOff className="w-6 h-6 opacity-40" />
          <p className="text-xs">No cloud files to restore</p>
        </div>
      )}

      {/* Locally-deleted files (still in cloud) */}
      {deletedLocalFiles.map((file) => (
        <CloudFileRow
          key={file.id}
          name={file.file_name}
          badge="Removed locally"
          badgeColor="amber"
          restoring={status === 'restoring'}
          onRestore={() => onRestore({ localFile: file })}
        />
      ))}

      {/* Pure cloud files (no local trace) */}
      {cloudOnlyFiles.map((cf) => (
        <CloudFileRow
          key={cf.uuid}
          name={cf.file_name}
          badge="Cloud only"
          badgeColor="blue"
          restoring={status === 'restoring'}
          onRestore={() => onRestore({ cloudFile: cf })}
        />
      ))}

      {/* Refresh footer */}
      {status !== 'loading' && (
        <div className="pt-1 border-t border-border/40">
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
          >
            <Cloud className="w-3.5 h-3.5" />
            Refresh cloud list
          </button>
        </div>
      )}
    </div>
  );
}

interface CloudFileRowProps {
  name: string;
  badge: string;
  badgeColor: 'amber' | 'blue';
  restoring: boolean;
  onRestore: () => void;
}

function CloudFileRow({ name, badge, badgeColor, restoring, onRestore }: CloudFileRowProps) {
  const badgeClasses =
    badgeColor === 'amber'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

  return (
    <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors">
      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" title={name}>{name}</p>
        <span className={`inline-block text-[10px] px-1 rounded leading-4 mt-0.5 ${badgeClasses}`}>
          {badge}
        </span>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        disabled={restoring}
        onClick={(e) => { e.stopPropagation(); onRestore(); }}
        title="Restore file"
      >
        {restoring ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <RotateCcw className="w-3 h-3 mr-1" />
            Restore
          </>
        )}
      </Button>
    </div>
  );
}
