use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WorkspaceFile {
    pub id: String,
    pub workspace_id: String,
    pub file_path: String,
    pub file_name: String,
    pub added_at: DateTime<Utc>,
    pub last_accessed_at: DateTime<Utc>,
    pub is_visible: bool,
    pub is_read_only: bool,
    pub metadata: Option<String>,
    // ── sync fields (added in migration 0012) ──────────────────────────────────
    /// Stable logical identity shared with the cloud (oyrenai_workspace_files.sync_id).
    /// NULL until the file has been synced at least once.
    pub sync_id: Option<String>,
    /// The cloud file UUID (oyrenai_workspace_files.uuid) this file is linked to.
    pub cloud_file_uuid: Option<String>,
    /// SHA-256 of local file content at last sync — used for local change detection.
    pub content_hash: Option<String>,
    /// ISO-8601 timestamp of the last successful sync for this file.
    pub last_synced_at: Option<String>,
    // ── local status (added in migration 0013) ─────────────────────────────────
    /// 'active' (default) or 'local_deleted' (synced file removed locally; cloud copy preserved).
    pub local_status: String,
}
