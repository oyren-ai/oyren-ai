/**
 * usePullFromCloud
 *
 * Lightweight one-way sync: downloads any cloud files that don't exist locally
 * (identified by sync_id matching). Does NOT upload anything.
 *
 * Intended for the sidebar "Refresh from cloud" button — a quick pull without
 * opening the full SyncWorkspaceDialog.
 */
import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { writeFile, mkdir } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { listCloudFiles, downloadCloudFile } from '@/api/syncApi';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import type { AddFileResult, Workspace, WorkspaceFile } from '@/types/workspace';

const AUTH_TOKEN_KEY = 'oyren_auth_token';

interface SyncState {
  workspaces: Record<string, { cloud_uuid: string }>;
}

export type PullStatus = 'idle' | 'pulling' | 'success' | 'error';

export interface UsePullFromCloudResult {
  status: PullStatus;
  pulled: number;
  error: string | null;
  /** Resolves with the number of files pulled. Only `id` is used. */
  pull: (workspace: Pick<Workspace, 'id'>) => Promise<number>;
  reset: () => void;
}

export function usePullFromCloud(): UsePullFromCloudResult {
  const [status, setStatus] = useState<PullStatus>('idle');
  const [pulled, setPulled] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pull = useCallback(async (workspace: Pick<Workspace, 'id'>): Promise<number> => {
    if (status === 'pulling') return 0;

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated.');
      setStatus('error');
      return 0;
    }

    setStatus('pulling');
    setError(null);
    setPulled(0);

    try {
      // Get cloud UUID for this workspace
      const syncState = await invoke<SyncState>('get_sync_state');
      const cloudUuid = syncState.workspaces[workspace.id]?.cloud_uuid;
      if (!cloudUuid) {
        // Workspace not linked yet — nothing to pull
        setStatus('idle');
        return 0;
      }

      // Fetch both sides in parallel
      const [cloudFiles, allLocalFiles] = await Promise.all([
        listCloudFiles(token, cloudUuid),
        invoke<WorkspaceFile[]>('list_all_workspace_files', { workspaceId: workspace.id }),
      ]);

      // Build sets for quick lookup
      const localSyncIds = new Set(
        allLocalFiles.map((f) => f.sync_id).filter(Boolean),
      );
      // Soft-deleted files should NOT be re-downloaded
      const deletedSyncIds = new Set(
        allLocalFiles
          .filter((f) => f.local_status === 'local_deleted')
          .map((f) => f.sync_id)
          .filter(Boolean),
      );

      // Cloud files that have no local counterpart and are not locally deleted
      const toDownload = cloudFiles.filter(
        (cf) =>
          cf.sync_id
            ? !localSyncIds.has(cf.sync_id) && !deletedSyncIds.has(cf.sync_id)
            : !localSyncIds.has(cf.uuid), // fallback: match by uuid if no sync_id
      );

      if (toDownload.length === 0) {
        setStatus('success');
        return 0;
      }

      const dataDir = await appDataDir();
      const workspacesDir = await join(dataDir, 'workspaces', workspace.id, 'workspace_files');
      let count = 0;

      for (const cloudFile of toDownload) {
        try {
          const blob = await downloadCloudFile(token, cloudUuid, cloudFile.uuid);
          const syncId = cloudFile.sync_id ?? crypto.randomUUID();

          const fileId = crypto.randomUUID();
          const fileDir = await join(workspacesDir, fileId);
          await mkdir(fileDir, { recursive: true });
          const destPath = await join(fileDir, cloudFile.file_name);
          const bytes = new Uint8Array(await blob.arrayBuffer());
          await writeFile(destPath, bytes);

          // Register in local DB — `create_workspace_file` returns AddFileResult, not WorkspaceFile.
          let newFileId: string | null = null;
          try {
            const addResult = await invoke<AddFileResult>('create_workspace_file', {
              workspaceId: workspace.id,
              sourceFilePath: destPath,
            });
            newFileId = addResult.workspace_file_id;
          } catch {
            const files = await workspaceFilesApi.listWorkspaceFiles(workspace.id, true);
            newFileId = files.find((f) => f.file_path === destPath)?.id ?? null;
          }

          if (newFileId) {
            await invoke('record_file_synced', {
              fileId: newFileId,
              syncId,
              cloudFileUuid: cloudFile.uuid,
              filePath: destPath,
            });
          }

          count++;
        } catch {
          // Skip individual failures silently; partial success is ok
        }
      }

      setPulled(count);
      window.dispatchEvent(new CustomEvent('workspace-files-changed'));
      setStatus('success');
      return count;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pull failed');
      setStatus('error');
      return 0;
    }
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setPulled(0);
    setError(null);
  }, []);

  return { status, pulled, error, pull, reset };
}
