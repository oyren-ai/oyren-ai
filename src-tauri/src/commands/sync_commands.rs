use crate::adapters::db::{repositories, WorkspaceFile};
use crate::adapters::os::file::hash_file;
use crate::services::sync_service::{SyncState, WorkspaceSyncMeta};
use crate::services::workspace_files_service;
use chrono::Utc;
use tauri::{AppHandle, Manager};

// ─── Sync state read / write ──────────────────────────────────────────────────

#[tauri::command]
pub async fn get_sync_state(app: AppHandle) -> Result<SyncState, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    SyncState::load(&app_data_dir)
}

#[tauri::command]
pub async fn save_sync_state(app: AppHandle, state: SyncState) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    state.save(&app_data_dir)
}

/// Link a local workspace to a cloud workspace UUID.
/// Creates or updates the entry in sync_state.json and returns the updated state.
#[tauri::command]
pub async fn link_workspace(
    app: AppHandle,
    local_workspace_id: String,
    cloud_uuid: String,
) -> Result<SyncState, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let mut state = SyncState::load(&app_data_dir)?;
    let now = Utc::now().to_rfc3339();
    state.set_workspace_link(local_workspace_id, cloud_uuid, now);
    state.save(&app_data_dir)?;
    Ok(state)
}

/// Clear the cloud link for a workspace (e.g. when the cloud workspace was deleted).
#[tauri::command]
pub async fn unlink_workspace(
    app: AppHandle,
    local_workspace_id: String,
) -> Result<SyncState, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let mut state = SyncState::load(&app_data_dir)?;
    state.clear_workspace_link(&local_workspace_id);
    state.save(&app_data_dir)?;
    Ok(state)
}

/// Mark a workspace sync as completed at the current time.
#[tauri::command]
pub async fn mark_workspace_synced(
    app: AppHandle,
    local_workspace_id: String,
) -> Result<SyncState, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let mut state = SyncState::load(&app_data_dir)?;
    let now = Utc::now().to_rfc3339();
    state.mark_synced(&local_workspace_id, now);
    state.save(&app_data_dir)?;
    Ok(state)
}

// ─── Per-file sync record update ─────────────────────────────────────────────

/// After successfully syncing a file (upload or download), record the sync metadata
/// in the local SQLite so subsequent syncs can detect what has changed.
#[tauri::command]
pub async fn record_file_synced(
    file_id: String,
    sync_id: String,
    cloud_file_uuid: String,
    file_path: String,
) -> Result<(), String> {
    let content_hash = hash_file(&file_path)
        .map_err(|e| format!("Failed to hash file: {:?}", e))?;
    let now = Utc::now().to_rfc3339();
    repositories::workspace_files::update_sync_fields(
        &file_id,
        &sync_id,
        &cloud_file_uuid,
        &content_hash,
        &now,
    )
    .await
}

/// Compute and return the SHA-256 hash of a local file.
/// Used by the frontend sync engine to detect local content changes.
#[tauri::command]
pub async fn hash_local_file(file_path: String) -> Result<String, String> {
    hash_file(&file_path).map_err(|e| format!("Failed to hash file: {:?}", e))
}

/// Migrate the legacy localStorage workspace map (exported from the frontend) into
/// sync_state.json so that existing workspace links survive reinstalls.
/// Call this once on first launch after upgrade — pass the parsed localStorage map.
#[tauri::command]
pub async fn migrate_local_storage_workspace_map(
    app: AppHandle,
    map: std::collections::HashMap<String, String>,
) -> Result<SyncState, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let mut state = SyncState::load(&app_data_dir)?;
    let now = Utc::now().to_rfc3339();
    for (local_id, cloud_uuid) in map {
        if !state.workspaces.contains_key(&local_id) {
            state.set_workspace_link(local_id, cloud_uuid, now.clone());
        }
    }
    state.save(&app_data_dir)?;
    Ok(state)
}

// ─── Soft-delete / restore commands ───────────────────────────────────────────

/// List files that were soft-deleted locally but whose cloud copy can be restored.
#[tauri::command]
pub async fn list_deleted_workspace_files(
    workspace_id: String,
) -> Result<Vec<WorkspaceFile>, String> {
    repositories::workspace_files::list_deleted_workspace_files(&workspace_id).await
}

/// List ALL files including soft-deleted (used by the sync engine).
#[tauri::command]
pub async fn list_all_workspace_files(
    workspace_id: String,
) -> Result<Vec<WorkspaceFile>, String> {
    repositories::workspace_files::list_all_workspace_files(&workspace_id).await
}

/// Restore a soft-deleted file back to active. The frontend must re-download the
/// file content from cloud and write it to disk before calling this.
#[tauri::command]
pub async fn restore_workspace_file(
    workspace_file_id: String,
    new_file_path: String,
) -> Result<(), String> {
    repositories::workspace_files::restore_file_with_path(&workspace_file_id, &new_file_path).await
}

/// Permanently delete a cloud file via the Next.js API and remove the local DB row.
/// This is the explicit "delete from cloud" action.
#[tauri::command]
pub async fn hard_delete_workspace_file(
    workspace_file_id: String,
) -> Result<(), String> {
    workspace_files_service::remove_file_from_workspace(&workspace_file_id)
        .await
        .map_err(|e| format!("Failed to hard-delete file: {:?}", e))
}
