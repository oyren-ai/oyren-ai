import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { writeFile, mkdir } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { downloadCloudFile, listDeletedCloudFiles } from '@/api/syncApi';
import type { CloudFile } from '@/api/syncApi';
import type { WorkspaceFile } from '@/types/workspace';

const AUTH_TOKEN_KEY = 'oyren_auth_token';

export type RestoreStatus = 'idle' | 'loading' | 'restoring' | 'success' | 'error';

export interface UseCloudFileRestoreResult {
  deletedLocalFiles: WorkspaceFile[];
  cloudOnlyFiles: CloudFile[];
  status: RestoreStatus;
  error: string | null;
  loadDeletedFiles: (workspaceId: string, cloudUuid: string) => Promise<void>;
  restoreFile: (params: RestoreParams) => Promise<void>;
  reset: () => void;
}

interface RestoreParams {
  workspaceId: string;
  cloudUuid: string;
  /** Provide when restoring a locally-deleted file that still has a DB row. */
  localFile?: WorkspaceFile;
  /** Provide when restoring a cloud-only file (no local DB row). */
  cloudFile?: CloudFile;
}

export function useCloudFileRestore(): UseCloudFileRestoreResult {
  const [deletedLocalFiles, setDeletedLocalFiles] = useState<WorkspaceFile[]>([]);
  const [cloudOnlyFiles, setCloudOnlyFiles] = useState<CloudFile[]>([]);
  const [status, setStatus] = useState<RestoreStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  /** Load both locally-deleted (have DB row) and pure cloud files. */
  const loadDeletedFiles = useCallback(async (workspaceId: string, cloudUuid: string) => {
    setStatus('loading');
    setError(null);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) { setError('Not authenticated.'); setStatus('error'); return; }
    try {
      const [localDeleted, cloudDeleted] = await Promise.all([
        invoke<WorkspaceFile[]>('list_deleted_workspace_files', { workspaceId }),
        listDeletedCloudFiles(token, cloudUuid),
      ]);
      setDeletedLocalFiles(localDeleted);
      // Cloud-only: cloud files not represented in local deleted list (no sync_id match)
      const localSyncIds = new Set(localDeleted.map((f) => f.sync_id).filter(Boolean));
      const cloudOnlyList = cloudDeleted.filter((cf) => cf.sync_id && !localSyncIds.has(cf.sync_id));
      setCloudOnlyFiles(cloudOnlyList);
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load cloud files');
      setStatus('error');
    }
  }, []);

  /** Restore a file: download blob from cloud, write to disk, update DB row. */
  const restoreFile = useCallback(async ({ workspaceId, cloudUuid, localFile, cloudFile }: RestoreParams) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) { setError('Not authenticated.'); return; }

    const cloudFileUuid = localFile?.cloud_file_uuid ?? cloudFile?.uuid;
    const fileName = localFile?.file_name ?? cloudFile?.file_name;
    if (!cloudFileUuid || !fileName) { setError('Cannot resolve cloud file.'); return; }

    setStatus('restoring');
    setError(null);
    try {
      // 1. Download binary from cloud
      const blob = await downloadCloudFile(token, cloudUuid, cloudFileUuid);
      const bytes = new Uint8Array(await blob.arrayBuffer());

      // 2. Write to local disk
      const dataDir = await appDataDir();
      const fileId = localFile?.id ?? crypto.randomUUID();
      const fileDir = await join(dataDir, 'workspaces', workspaceId, 'workspace_files', fileId);
      await mkdir(fileDir, { recursive: true });
      const destPath = await join(fileDir, fileName);
      await writeFile(destPath, bytes);

      // 3a. If existing DB row — restore_workspace_file (update local_status + file_path)
      if (localFile) {
        await invoke('restore_workspace_file', {
          workspaceFileId: localFile.id,
          newFilePath: destPath,
        });
      } else {
        // 3b. No DB row — register fresh + record sync
        await invoke('create_workspace_file', { workspaceId, sourceFilePath: destPath });
        // sync_id linkage will be picked up on next full sync
      }

      // 4. Refresh file list
      window.dispatchEvent(new CustomEvent('workspace-files-changed'));
      setStatus('success');

      // Remove from deleted list
      setDeletedLocalFiles((prev) => prev.filter((f) => f.id !== localFile?.id));
      if (cloudFile) setCloudOnlyFiles((prev) => prev.filter((f) => f.uuid !== cloudFile.uuid));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { deletedLocalFiles, cloudOnlyFiles, status, error, loadDeletedFiles, restoreFile, reset };
}
