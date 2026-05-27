/**
 * HTTP client for cloud sync operations.
 * All functions talk to the oyren-ai-next API and require a Bearer token.
 */

import { getOyrenWebApiBaseUrl, normalizeOyrenWebFetchError } from './oyrenWebApiBaseUrl';

export interface CloudFile {
  uuid: string;
  file_name: string;
  file_size: number | null;
  ocr_scanned: boolean;
  etag: string | null;
  sync_id: string | null;
  date_created: string | null;
  date_updated: string | null;
}

export interface CloudWorkspace {
  uuid: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  date_created: string | null;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/** List all cloud workspaces for the authenticated user. */
export async function listCloudWorkspaces(token: string): Promise<CloudWorkspace[]> {
  const baseUrl = getOyrenWebApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/workspaces`, { headers: authHeaders(token) });
  } catch (e) {
    throw new Error(normalizeOyrenWebFetchError(e, baseUrl));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Failed to list cloud workspaces');
  }
  return res.json();
}

/** Check whether a cloud workspace still exists. Returns false if deleted. */
export async function cloudWorkspaceExists(token: string, cloudUuid: string): Promise<boolean> {
  const baseUrl = getOyrenWebApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/workspaces/${cloudUuid}`, {
      headers: authHeaders(token),
    });
    return res.ok;
  } catch {
    return true; // Network error — assume exists; upload will fail with a proper message
  }
}

/** Create a new cloud workspace and return its UUID. */
export async function createCloudWorkspace(
  token: string,
  name: string,
  description?: string,
): Promise<string> {
  const baseUrl = getOyrenWebApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/workspaces`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
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

/**
 * List cloud-published files in a workspace.
 * Passes ?sync=true so the server only returns files with cloud_synced=true,
 * skipping web-local files that the user hasn't explicitly published yet.
 */
export async function listCloudFiles(token: string, cloudUuid: string): Promise<CloudFile[]> {
  const baseUrl = getOyrenWebApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/workspaces/${cloudUuid}/files?sync=true`, {
      headers: authHeaders(token),
    });
  } catch (e) {
    throw new Error(normalizeOyrenWebFetchError(e, baseUrl));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Failed to list cloud files');
  }
  return res.json();
}

export interface UploadFileParams {
  cloudUuid: string;
  token: string;
  blob: Blob;
  fileName: string;
  ocrScanned?: boolean;
  syncId?: string;
}

/**
 * Upload a file to the cloud workspace.
 * Idempotent: if sync_id is provided and the file already exists, the server
 * returns the existing record without creating a duplicate.
 */
export async function uploadFileToCloud(params: UploadFileParams): Promise<CloudFile> {
  const baseUrl = getOyrenWebApiBaseUrl();
  const { cloudUuid, token, blob, fileName, ocrScanned, syncId } = params;
  const formData = new FormData();
  formData.append('file', blob, fileName);
  if (ocrScanned) formData.append('ocr_scanned', 'true');
  if (syncId) formData.append('sync_id', syncId);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/workspaces/${cloudUuid}/files`, {
      method: 'POST',
      headers: authHeaders(token),
      body: formData,
    });
  } catch (e) {
    throw new Error(normalizeOyrenWebFetchError(e, baseUrl));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Upload failed');
  }
  return res.json();
}

/**
 * Update the text content of an existing cloud file.
 * Bumps date_updated server-side for change detection.
 */
export async function updateCloudFileContent(
  token: string,
  cloudUuid: string,
  fileUuid: string,
  content: string,
): Promise<void> {
  const baseUrl = getOyrenWebApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/workspaces/${cloudUuid}/files/${fileUuid}/content`, {
      method: 'PUT',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  } catch (e) {
    throw new Error(normalizeOyrenWebFetchError(e, baseUrl));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Failed to update cloud file content');
  }
}

/** Download the raw content of a cloud file. Returns the Blob. */
export async function downloadCloudFile(
  token: string,
  cloudUuid: string,
  fileUuid: string,
): Promise<Blob> {
  const baseUrl = getOyrenWebApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/workspaces/${cloudUuid}/files/${fileUuid}/content`, {
      headers: authHeaders(token),
    });
  } catch (e) {
    throw new Error(normalizeOyrenWebFetchError(e, baseUrl));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Failed to download cloud file');
  }
  return res.blob();
}

/**
 * Assign a sync_id to an existing cloud file (LINK operation).
 * Called when a legacy file is matched by name and gets a sync_id for the first time.
 */
export async function linkCloudFile(
  token: string,
  cloudUuid: string,
  fileUuid: string,
  syncId: string,
): Promise<void> {
  const baseUrl = getOyrenWebApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/workspaces/${cloudUuid}/files/${fileUuid}`, {
      method: 'PATCH',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ sync_id: syncId }),
    });
  } catch (e) {
    throw new Error(normalizeOyrenWebFetchError(e, baseUrl));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Failed to link cloud file');
  }
}

// ─── Unified sync: restore & cloud delete ────────────────────────────────────

/**
 * Restore a soft-deleted cloud file back to active.
 * The S3 object was never removed, so the file is immediately available again.
 */
export async function restoreCloudFile(
  token: string,
  cloudUuid: string,
  fileUuid: string,
): Promise<void> {
  const baseUrl = getOyrenWebApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/workspaces/${cloudUuid}/files/${fileUuid}/restore`, {
      method: 'POST',
      headers: authHeaders(token),
    });
  } catch (e) {
    throw new Error(normalizeOyrenWebFetchError(e, baseUrl));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Failed to restore cloud file');
  }
}

/**
 * Permanently delete a cloud file (removes S3 object + DB record).
 * This is the explicit "delete from cloud" action — cannot be undone.
 */
export async function deleteCloudFilePermanently(
  token: string,
  cloudUuid: string,
  fileUuid: string,
): Promise<void> {
  const baseUrl = getOyrenWebApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/workspaces/${cloudUuid}/files/${fileUuid}?permanent=true`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  } catch (e) {
    throw new Error(normalizeOyrenWebFetchError(e, baseUrl));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Failed to permanently delete cloud file');
  }
}

/**
 * List files that were soft-deleted in the cloud workspace.
 * These are available for restore (S3 objects still intact).
 */
export async function listDeletedCloudFiles(token: string, cloudUuid: string): Promise<CloudFile[]> {
  const baseUrl = getOyrenWebApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/workspaces/${cloudUuid}/files/cloud`, {
      headers: authHeaders(token),
    });
  } catch (e) {
    throw new Error(normalizeOyrenWebFetchError(e, baseUrl));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Failed to list deleted cloud files');
  }
  return res.json();
}
