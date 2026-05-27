export interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_favourite: boolean;
  settings?: string;
  is_active: boolean;
}

export interface WorkspaceDisplay extends Workspace {
  document_count: number;
  chat_count: number;
  lastAccessed?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export type LocalFileStatus = 'active' | 'local_deleted';

export interface WorkspaceFile {
  id: string;
  workspace_id: string;
  file_path: string;
  file_name: string;
  added_at: string;
  last_accessed_at: string;
  is_visible: boolean;
  is_read_only: boolean;
  metadata?: string;
  content?: string;
  // ── sync fields (populated after migration 0012) ─────────────────────────
  /** Stable logical identity shared with the cloud workspace file. */
  sync_id?: string | null;
  /** The cloud oyrenai_workspace_files.uuid this file is linked to. */
  cloud_file_uuid?: string | null;
  /** SHA-256 of local file content at last sync — used for change detection. */
  content_hash?: string | null;
  /** ISO-8601 timestamp of the last successful sync for this file. */
  last_synced_at?: string | null;
  // ── local status (populated after migration 0013) ────────────────────────
  /** 'active' (default) or 'local_deleted' (synced file removed locally; cloud copy preserved). */
  local_status: LocalFileStatus;
}

export interface AddFileResult {
  workspace_file_id: string;
  workspace_file_path: string;
  original_filename: string;
  was_deduplicated: boolean;
}