import { useState, useCallback } from 'react';
import { readFile } from '@tauri-apps/plugin-fs';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import { categorizeWorkspaceFile } from '@/features/workspace-management/utils/categorizeWorkspaceFile';
import { getOyrenWebApiBaseUrl, normalizeOyrenWebFetchError } from '@/api/oyrenWebApiBaseUrl';
import type { WorkspaceDisplay } from '@/types/workspace';

const AUTH_TOKEN_KEY = 'oyren_auth_token';
const CLOUD_MAP_KEY = 'oyren_cloud_workspace_map';

export type BackupStatus = 'idle' | 'running' | 'success' | 'error';

export interface BackupError {
  file: string;
  message: string;
}

export interface BackupProgress {
  total: number;
  completed: number;
  currentFile: string;
  errors: BackupError[];
}

// ─── localStorage helpers ──────────────────────────────────────────────────────

function getCloudMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CLOUD_MAP_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveCloudUuid(localId: string, cloudUuid: string): void {
  const map = getCloudMap();
  map[localId] = cloudUuid;
  localStorage.setItem(CLOUD_MAP_KEY, JSON.stringify(map));
}

function clearCloudUuid(localId: string): void {
  const map = getCloudMap();
  delete map[localId];
  localStorage.setItem(CLOUD_MAP_KEY, JSON.stringify(map));
}

/** Returns the cloud workspace UUID for a local workspace id, or null if not yet backed up. */
export function getCloudWorkspaceUuid(localId: string): string | null {
  return getCloudMap()[localId] ?? null;
}

// ─── Cloud workspace helpers ───────────────────────────────────────────────────

async function createCloudWorkspace(
  baseUrl: string,
  authHeaders: Record<string, string>,
  workspace: WorkspaceDisplay,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/workspaces`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: workspace.name, description: workspace.description }),
    });
  } catch (e) {
    throw new Error(normalizeOyrenWebFetchError(e, baseUrl));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Failed to create cloud workspace');
  }
  const data = await res.json();
  return data.uuid as string;
}

/** Verify cached UUID still exists on the server. Returns false if workspace was deleted. */
async function cloudWorkspaceExists(
  baseUrl: string,
  authHeaders: Record<string, string>,
  cloudUuid: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/workspaces/${cloudUuid}`, {
      method: 'GET',
      headers: authHeaders,
    });
    return res.ok;
  } catch {
    // Network error — assume exists and let the upload fail with a proper message
    return true;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBackupWorkspace() {
  const [status, setStatus] = useState<BackupStatus>('idle');
  const [progress, setProgress] = useState<BackupProgress>({
    total: 0,
    completed: 0,
    currentFile: '',
    errors: [],
  });

  const backup = useCallback(async (workspace: WorkspaceDisplay) => {
    const baseUrl = getOyrenWebApiBaseUrl();
    setStatus('running');
    setProgress({ total: 0, completed: 0, currentFile: '', errors: [] });

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setStatus('error');
      setProgress(p => ({
        ...p,
        errors: [{ file: '', message: 'Not authenticated. Please sign in.' }],
      }));
      return;
    }

    const authHeaders: Record<string, string> = { Authorization: `Bearer ${token}` };

    try {
      // 1. Get or create cloud workspace — re-create if it was deleted on the web
      let cloudUuid = getCloudWorkspaceUuid(workspace.id);

      if (cloudUuid) {
        const exists = await cloudWorkspaceExists(baseUrl, authHeaders, cloudUuid);
        if (!exists) {
          clearCloudUuid(workspace.id);
          cloudUuid = null;
        }
      }

      if (!cloudUuid) {
        cloudUuid = await createCloudWorkspace(baseUrl, authHeaders, workspace);
        saveCloudUuid(workspace.id, cloudUuid);
      }

      // 2. List local files — skip 'Other' (unrecognised types)
      const files = await workspaceFilesApi.listWorkspaceFiles(workspace.id, false);
      const backupFiles = files.filter(f => categorizeWorkspaceFile(f) !== 'Other');

      setProgress(p => ({ ...p, total: backupFiles.length }));

      // 3. Upload each file
      for (const file of backupFiles) {
        setProgress(p => ({ ...p, currentFile: file.file_name }));

        try {
          const category = categorizeWorkspaceFile(file);
          let blob: Blob;

          if (category === 'Documents') {
            // Binary PDF — use fs plugin for raw bytes
            const bytes = await readFile(file.file_path);
            blob = new Blob([bytes], { type: 'application/pdf' });
          } else {
            // Text files: Notes (.md), Scans (.md + metadata), LatexNotes (.tex)
            const content = await workspaceFilesApi.readFile(file.id);
            const mime = file.file_name.toLowerCase().endsWith('.tex')
              ? 'text/x-tex'
              : 'text/markdown';
            blob = new Blob([content], { type: mime });
          }

          const formData = new FormData();
          formData.append('file', blob, file.file_name);
          if (category === 'Scans') {
            formData.append('ocr_scanned', 'true');
          }

          let uploadRes: Response;
          try {
            uploadRes = await fetch(
              `${baseUrl}/api/workspaces/${cloudUuid}/files`,
              { method: 'POST', headers: authHeaders, body: formData },
            );
          } catch (e) {
            throw new Error(normalizeOyrenWebFetchError(e, baseUrl));
          }

          if (!uploadRes.ok) {
            const err = await uploadRes.json().catch(() => ({ error: uploadRes.statusText }));
            throw new Error(err.error ?? 'Upload failed');
          }
        } catch (err) {
          const message = normalizeOyrenWebFetchError(err, baseUrl);
          setProgress(p => ({
            ...p,
            errors: [...p.errors, { file: file.file_name, message }],
          }));
        }

        setProgress(p => ({ ...p, completed: p.completed + 1 }));
      }

      setStatus('success');
    } catch (err) {
      const message = normalizeOyrenWebFetchError(err, baseUrl);
      setProgress(p => ({
        ...p,
        errors: p.errors.length ? p.errors : [{ file: '', message }],
      }));
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress({ total: 0, completed: 0, currentFile: '', errors: [] });
  }, []);

  return { backup, status, progress, reset };
}
