//! Persistent sync state — workspace link map stored in `{app_data_dir}/oyren_sync_state.json`.
//!
//! This file is the durable record that ties each local workspace UUID to its cloud workspace UUID.
//! It survives app reinstalls (unlike localStorage) and is the single source of truth for sync linkage.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

const STATE_FILE_NAME: &str = "oyren_sync_state.json";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SyncState {
    pub version: u32,
    /// Map of local workspace UUID → workspace sync metadata.
    pub workspaces: HashMap<String, WorkspaceSyncMeta>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceSyncMeta {
    /// The cloud workspace UUID (`oyrenai_workspaces.uuid`).
    pub cloud_uuid: String,
    /// ISO-8601 timestamp of the last successful full sync for this workspace.
    pub last_synced_at: Option<String>,
    /// ISO-8601 timestamp when this link was first established.
    pub linked_at: String,
}

impl SyncState {
    fn state_path(app_data_dir: &Path) -> std::path::PathBuf {
        app_data_dir.join(STATE_FILE_NAME)
    }

    /// Read the sync state from disk. Returns a default (empty) state if the file does not exist yet.
    pub fn load(app_data_dir: &Path) -> Result<Self, String> {
        let path = Self::state_path(app_data_dir);
        if !path.exists() {
            return Ok(SyncState { version: 1, workspaces: HashMap::new() });
        }
        let raw = std::fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read sync state: {}", e))?;
        serde_json::from_str::<SyncState>(&raw)
            .map_err(|e| format!("Failed to parse sync state: {}", e))
    }

    /// Persist the sync state to disk (atomic write via temp file).
    pub fn save(&self, app_data_dir: &Path) -> Result<(), String> {
        let path = Self::state_path(app_data_dir);
        let tmp = path.with_extension("tmp");
        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize sync state: {}", e))?;
        std::fs::write(&tmp, &json)
            .map_err(|e| format!("Failed to write sync state: {}", e))?;
        std::fs::rename(&tmp, &path)
            .map_err(|e| format!("Failed to finalize sync state: {}", e))?;
        Ok(())
    }

    /// Return the cloud UUID linked to the given local workspace, if any.
    pub fn cloud_uuid_for(&self, local_workspace_id: &str) -> Option<&str> {
        self.workspaces
            .get(local_workspace_id)
            .map(|m| m.cloud_uuid.as_str())
    }

    /// Create or update the workspace link.
    pub fn set_workspace_link(
        &mut self,
        local_workspace_id: String,
        cloud_uuid: String,
        now_iso: String,
    ) {
        let entry = self.workspaces.entry(local_workspace_id).or_insert_with(|| WorkspaceSyncMeta {
            cloud_uuid: cloud_uuid.clone(),
            last_synced_at: None,
            linked_at: now_iso.clone(),
        });
        entry.cloud_uuid = cloud_uuid;
    }

    /// Update `last_synced_at` for a workspace after a successful sync.
    pub fn mark_synced(&mut self, local_workspace_id: &str, now_iso: String) {
        if let Some(meta) = self.workspaces.get_mut(local_workspace_id) {
            meta.last_synced_at = Some(now_iso);
        }
    }

    /// Remove the link for a workspace (e.g. if the cloud workspace was deleted).
    pub fn clear_workspace_link(&mut self, local_workspace_id: &str) {
        self.workspaces.remove(local_workspace_id);
    }
}
