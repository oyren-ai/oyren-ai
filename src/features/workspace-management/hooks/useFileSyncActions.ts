import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { readFile } from '@tauri-apps/plugin-fs';
import { categorizeWorkspaceFile } from '@/features/workspace-management/utils/categorizeWorkspaceFile';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import { uploadFileToCloud } from '@/api/syncApi';
import type { WorkspaceFile } from '@/types/workspace';

const AUTH_TOKEN_KEY = 'oyren_auth_token';

export interface UseFileSyncActionsResult {
  /** Set of file IDs currently being uploaded. */
  uploadingIds: Set<string>;
  /** Upload a single local file to the linked cloud workspace. */
  uploadFile: (file: WorkspaceFile, cloudUuid: string) => Promise<void>;
  /** Last per-file error keyed by fileId. */
  errors: Record<string, string>;
  clearError: (fileId: string) => void;
}

async function readFileAsBlob(file: WorkspaceFile): Promise<{ blob: Blob }> {
  const category = categorizeWorkspaceFile(file);
  if (category === 'Documents') {
    const bytes = await readFile(file.file_path);
    return { blob: new Blob([bytes], { type: 'application/pdf' }) };
  }
  const content = await workspaceFilesApi.readFile(file.id);
  const mimeType = file.file_name.toLowerCase().endsWith('.tex') ? 'text/x-tex' : 'text/markdown';
  return { blob: new Blob([content], { type: mimeType }) };
}

export function useFileSyncActions(): UseFileSyncActionsResult {
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const uploadFile = useCallback(async (file: WorkspaceFile, cloudUuid: string) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setErrors((e) => ({ ...e, [file.id]: 'Not authenticated.' }));
      return;
    }
    if (uploadingIds.has(file.id)) return;

    setUploadingIds((s) => new Set([...s, file.id]));
    setErrors((e) => { const n = { ...e }; delete n[file.id]; return n; });

    try {
      const { blob } = await readFileAsBlob(file);
      const syncId = file.sync_id ?? crypto.randomUUID();

      const cloudFile = await uploadFileToCloud({
        cloudUuid,
        token,
        blob,
        fileName: file.file_name,
        ocrScanned: categorizeWorkspaceFile(file) === 'Scans',
        syncId,
      });

      // Record sync metadata in local SQLite
      await invoke('record_file_synced', {
        fileId: file.id,
        syncId,
        cloudFileUuid: cloudFile.uuid,
        filePath: file.file_path,
      });

      // Refresh file list so badge updates
      window.dispatchEvent(new CustomEvent('workspace-files-changed'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setErrors((errs) => ({ ...errs, [file.id]: msg }));
    } finally {
      setUploadingIds((s) => { const n = new Set(s); n.delete(file.id); return n; });
    }
  }, [uploadingIds]);

  const clearError = useCallback((fileId: string) => {
    setErrors((e) => { const n = { ...e }; delete n[fileId]; return n; });
  }, []);

  return { uploadingIds, uploadFile, errors, clearError };
}
