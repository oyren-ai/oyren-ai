use crate::adapters::db::WorkspaceFile;
use crate::errors::pdf_service_error_to_string;
use crate::services::workspace_files_service;
use crate::services::AddFileResult;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn list_workspace_files(
    app: AppHandle,
    workspace_id: String,
    is_not_intersection: Option<bool>,
) -> Result<Vec<WorkspaceFile>, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let workspaces_base_dir = app_data_dir.join("workspaces");

    workspace_files_service::list_workspace_files(
        &workspaces_base_dir,
        workspace_id.as_str(),
        is_not_intersection,
    )
    .await
}

#[tauri::command]
pub async fn create_workspace_file(
    app: AppHandle,
    workspace_id: String,
    source_file_path: String,
) -> Result<AddFileResult, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let workspaces_base_dir = app_data_dir.join("workspaces");

    workspace_files_service::add_file_to_workspace(
        &workspaces_base_dir,
        &workspace_id,
        &source_file_path,
    )
    .await
    .map_err(|e| pdf_service_error_to_string(&e))
}

/// Delete a file from a workspace.
/// Synced files (with sync_id) are soft-deleted: removed from disk but DB row preserved
/// so the cloud copy is not re-downloaded on next sync.
/// Local-only files are fully removed from both disk and DB.
#[tauri::command]
pub async fn delete_workspace_file(workspace_file_id: String) -> Result<(), String> {
    let pool = crate::adapters::db::sqlite::get_db_pool()?;
    let file = crate::adapters::db::repositories::workspace_files::get_workspace_file(pool, &workspace_file_id)
        .await
        .map_err(|e| format!("File not found: {}", e))?;

    if file.sync_id.is_some() {
        workspace_files_service::soft_delete_workspace_file(&workspace_file_id)
            .await
            .map_err(|e| pdf_service_error_to_string(&e))
    } else {
        workspace_files_service::remove_file_from_workspace(&workspace_file_id)
            .await
            .map_err(|e| pdf_service_error_to_string(&e))
    }
}

#[tauri::command]
pub async fn get_workspace_file(
    app: AppHandle,
    file_id: String,
    with_content: Option<bool>,
) -> Result<workspace_files_service::WorkspaceFileWithContent, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let workspaces_base_dir = app_data_dir.join("workspaces");

    workspace_files_service::get_workspace_file(
        &workspaces_base_dir,
        &file_id,
        with_content.unwrap_or(false),
    )
    .await
    .map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub async fn copy_workspace_file(
    app: AppHandle,
    workspace_file_id: String,
    destination_workspace_id: String,
) -> Result<AddFileResult, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let workspaces_base_dir = app_data_dir.join("workspaces");

    workspace_files_service::copy_file_to_workspace(
        &workspaces_base_dir,
        &workspace_file_id,
        &destination_workspace_id,
    )
    .await
    .map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub async fn rename_workspace_file(
    app: AppHandle,
    workspace_file_id: String,
    new_file_name: String,
) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let workspaces_base_dir = app_data_dir.join("workspaces");

    workspace_files_service::rename_workspace_file(
        &workspaces_base_dir,
        &workspace_file_id,
        &new_file_name,
    )
    .await
    .map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub async fn download_arxiv_paper(
    app: AppHandle,
    workspace_id: String,
    pdf_url: String,
    filename: String,
) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let workspaces_base_dir = app_data_dir.join("workspaces");

    workspace_files_service::download_arxiv_paper(
        &workspaces_base_dir,
        &workspace_id,
        &pdf_url,
        &filename,
    )
    .await
    .map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub async fn update_workspace_file_metadata(
    workspace_file_id: String,
    metadata: Option<String>,
) -> Result<(), String> {
    workspace_files_service::update_file_metadata(&workspace_file_id, metadata)
        .await
        .map_err(|e| pdf_service_error_to_string(&e))
}
