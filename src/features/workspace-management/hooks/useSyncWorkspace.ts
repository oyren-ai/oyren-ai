import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { readFile, writeFile, mkdir } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import { categorizeWorkspaceFile } from '@/features/workspace-management/utils/categorizeWorkspaceFile';
import { normalizeOyrenWebFetchError } from '@/api/oyrenWebApiBaseUrl';
import {
  listCloudFiles,
  uploadFileToCloud,
  downloadCloudFile,
  linkCloudFile,
  cloudWorkspaceExists,
  createCloudWorkspace,
} from '@/api/syncApi';
import { buildSyncDiff } from '@/features/workspace-management/utils/buildSyncDiff';
import type { SyncAction } from '@/features/workspace-management/utils/buildSyncDiff';
import type { AddFileResult, WorkspaceDisplay, WorkspaceFile } from '@/types/workspace';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'resolving' | 'comparing' | 'syncing' | 'success' | 'error';

export interface SyncFileError {
  file: string;
  message: string;
}

export interface ConflictInfo {
  localFile: WorkspaceFile;
  cloudFileUuid: string;
  cloudFileName: string;
}

export interface SyncProgress {
  phase: string;
  total: number;
  completed: number;
  currentFile: string;
  uploaded: number;
  downloaded: number;
  linked: number;
  skipped: number;
  conflicts: ConflictInfo[];
  errors: SyncFileError[];
}

const AUTH_TOKEN_KEY = 'oyren_auth_token';

const INITIAL_PROGRESS: SyncProgress = {
  phase: '',
  total: 0,
  completed: 0,
  currentFile: '',
  uploaded: 0,
  downloaded: 0,
  linked: 0,
  skipped: 0,
  conflicts: [],
  errors: [],
};

// ─── Tauri invoke helpers ─────────────────────────────────────────────────────

interface SyncState {
  version: number;
  workspaces: Record<string, { cloud_uuid: string; last_synced_at: string | null; linked_at: string }>;
}

async function getSyncState(): Promise<SyncState> {
  return invoke<SyncState>('get_sync_state');
}

async function linkWorkspace(localId: string, cloudUuid: string): Promise<SyncState> {
  return invoke<SyncState>('link_workspace', { localWorkspaceId: localId, cloudUuid });
}

async function unlinkWorkspace(localId: string): Promise<SyncState> {
  return invoke<SyncState>('unlink_workspace', { localWorkspaceId: localId });
}

async function markWorkspaceSynced(localId: string): Promise<SyncState> {
  return invoke<SyncState>('mark_workspace_synced', { localWorkspaceId: localId });
}

async function recordFileSynced(
  fileId: string,
  syncId: string,
  cloudFileUuid: string,
  filePath: string,
): Promise<void> {
  return invoke<void>('record_file_synced', { fileId, syncId, cloudFileUuid, filePath });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSyncWorkspace() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [progress, setProgress] = useState<SyncProgress>(INITIAL_PROGRESS);

  const addError = useCallback((file: string, message: string) => {
    setProgress((p) => ({ ...p, errors: [...p.errors, { file, message }] }));
  }, []);

  // ── Main sync entry point ──────────────────────────────────────────────────
  const sync = useCallback(
    async (workspace: WorkspaceDisplay) => {
      setStatus('resolving');
      setProgress(INITIAL_PROGRESS);

      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        setProgress((p) => ({
          ...p,
          errors: [{ file: '', message: 'Not authenticated. Please sign in.' }],
        }));
        setStatus('error');
        return;
      }

      try {
        // ── Phase 1: Resolve workspace link ───────────────────────────────────
        setProgress((p) => ({ ...p, phase: 'Resolving workspace link…' }));
        let syncState = await getSyncState();
        let cloudUuid: string | null =
          syncState.workspaces[workspace.id]?.cloud_uuid ?? null;

        if (cloudUuid) {
          const exists = await cloudWorkspaceExists(token, cloudUuid);
          if (!exists) {
            await unlinkWorkspace(workspace.id);
            cloudUuid = null;
          }
        }

        if (!cloudUuid) {
          cloudUuid = await createCloudWorkspace(token, workspace.name, workspace.description);
          await linkWorkspace(workspace.id, cloudUuid);
          syncState = await getSyncState();
        }

        // ── Phase 2: Gather both sides ─────────────────────────────────────
        setProgress((p) => ({ ...p, phase: 'Fetching file lists…' }));
        const [cloudFiles, localFiles, allLocalFiles] = await Promise.all([
          listCloudFiles(token, cloudUuid),
          workspaceFilesApi.listWorkspaceFiles(workspace.id, false),
          invoke<WorkspaceFile[]>('list_all_workspace_files', { workspaceId: workspace.id }),
        ]);

        // Separate soft-deleted files so they suppress cloud re-downloads
        const deletedFiles = allLocalFiles.filter((f) => f.local_status === 'local_deleted');

        // ── Phase 3: Build diff ───────────────────────────────────────────
        setStatus('comparing');
        setProgress((p) => ({ ...p, phase: 'Comparing files…' }));

        const lastSyncHashes = new Map<string, { localHash: string; cloudEtag: string | null }>();
        for (const lf of localFiles) {
          if (lf.sync_id && lf.content_hash) {
            const cloudFile = cloudFiles.find((cf) => cf.sync_id === lf.sync_id);
            lastSyncHashes.set(lf.id, {
              localHash: lf.content_hash,
              cloudEtag: cloudFile?.etag ?? null,
            });
          }
        }

        const diff = buildSyncDiff({
          localFiles,
          cloudFiles,
          lastSyncHashes,
          lastSyncedAt: null,
          deletedFiles,
        });

        setProgress((p) => ({
          ...p,
          total: diff.actions.length,
          conflicts: [],
        }));

        // ── Phase 4: Execute transfers ────────────────────────────────────
        setStatus('syncing');
        let uploaded = 0;
        let downloaded = 0;
        let linked = 0;
        let skipped = 0;

        for (const action of diff.actions) {
          setProgress((p) => ({ ...p, phase: 'Syncing files…', currentFile: getActionFileName(action) }));

          try {
            await executeAction(action, {
              token,
              cloudUuid,
              workspace,
              onUpload: () => { uploaded++; setProgress((p) => ({ ...p, uploaded, completed: p.completed + 1 })); },
              onDownload: () => { downloaded++; setProgress((p) => ({ ...p, downloaded, completed: p.completed + 1 })); },
              onLinked: () => { linked++; setProgress((p) => ({ ...p, linked, completed: p.completed + 1 })); },
              onSkip: () => { skipped++; setProgress((p) => ({ ...p, skipped, completed: p.completed + 1 })); },
            });
          } catch (err) {
            const fileName = getActionFileName(action);
            addError(fileName, normalizeOyrenWebFetchError(err, ''));
            setProgress((p) => ({ ...p, completed: p.completed + 1 }));
          }
        }

        // ── Phase 5: Mark sync complete ───────────────────────────────────
        await markWorkspaceSynced(workspace.id);
        setProgress((p) => ({
          ...p,
          phase: 'Done',
          currentFile: '',
          uploaded,
          downloaded,
          linked,
          skipped,
        }));
        setStatus('success');
      } catch (err) {
        const message = normalizeOyrenWebFetchError(err, '');
        setProgress((p) => ({
          ...p,
          errors: p.errors.length ? p.errors : [{ file: '', message }],
        }));
        setStatus('error');
      }
    },
    [addError],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(INITIAL_PROGRESS);
  }, []);

  return { sync, status, progress, reset };
}

// ─── Action executor ──────────────────────────────────────────────────────────

interface ExecuteContext {
  token: string;
  cloudUuid: string;
  workspace: WorkspaceDisplay;
  onUpload: () => void;
  onDownload: () => void;
  onLinked: () => void;
  onSkip: () => void;
}

async function executeAction(action: SyncAction, ctx: ExecuteContext): Promise<void> {
  const { token, cloudUuid, workspace, onUpload, onDownload, onLinked, onSkip } = ctx;

  switch (action.kind) {
    case 'skip': {
      onSkip();
      return;
    }

    case 'link': {
      await linkCloudFile(token, cloudUuid, action.cloud.uuid, action.assignedSyncId);
      await recordFileSynced(
        action.local.id,
        action.assignedSyncId,
        action.cloud.uuid,
        action.local.file_path,
      );
      onLinked();
      return;
    }

    case 'upload_new': {
      const { blob } = await readLocalFileAsBlob(action.local);
      const uploaded = await uploadFileToCloud({
        cloudUuid,
        token,
        blob,
        fileName: action.local.file_name,
        ocrScanned: isScanMarkdownForCloudUpload(action.local),
        syncId: action.assignedSyncId,
      });
      await recordFileSynced(
        action.local.id,
        action.assignedSyncId,
        uploaded.uuid,
        action.local.file_path,
      );
      onUpload();
      return;
    }

    case 'download_new': {
      const blob = await downloadCloudFile(token, cloudUuid, action.cloud.uuid);
      const syncId = action.cloud.sync_id ?? crypto.randomUUID();
      const dataDir = await appDataDir();
      const workspacesDir = await join(dataDir, 'workspaces', workspace.id, 'workspace_files');
      const fileId = crypto.randomUUID();
      const fileDir = await join(workspacesDir, fileId);
      await mkdir(fileDir, { recursive: true });
      const destPath = await join(fileDir, action.cloud.file_name);
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
        await recordFileSynced(newFileId, syncId, action.cloud.uuid, destPath);
      }
      onDownload();
      return;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function readLocalFileAsBlob(
  file: WorkspaceFile,
): Promise<{ blob: Blob; mimeType: string }> {
  const category = categorizeWorkspaceFile(file);
  if (category === 'Documents') {
    const bytes = await readFile(file.file_path);
    return { blob: new Blob([bytes], { type: 'application/pdf' }), mimeType: 'application/pdf' };
  }
  const content = await workspaceFilesApi.readFile(file.id);
  const mimeType = file.file_name.toLowerCase().endsWith('.tex') ? 'text/x-tex' : 'text/markdown';
  return { blob: new Blob([content], { type: mimeType }), mimeType };
}

/**
 * Must match backup behaviour (`useBackupWorkspace`): PDF-derived scan notes use
 * `source_pdf_id` in metadata (see marker `convert_pdf.rs`), not `ocr_scanned`.
 * The web UI buckets markdown by `ocr_scanned` (see `file-helpers.categorizeFiles`).
 */
function isScanMarkdownForCloudUpload(file: WorkspaceFile): boolean {
  if (categorizeWorkspaceFile(file) === 'Scans') return true;
  try {
    const meta = file.metadata ? JSON.parse(file.metadata) : {};
    return meta?.ocr_scanned === true;
  } catch {
    return false;
  }
}

function getActionFileName(action: SyncAction): string {
  switch (action.kind) {
    case 'upload_new':
    case 'link':
    case 'skip':
      return action.local?.file_name ?? '';
    case 'download_new':
      return action.cloud?.file_name ?? '';
  }
}
