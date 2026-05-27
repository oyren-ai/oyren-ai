use crate::adapters::db::models::{Workspace, WorkspaceDisplay};
use crate::services::workspace_service;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn create_workspace(
    app: AppHandle,
    name: String,
    description: Option<String>,
) -> Result<Workspace, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let workspaces_base_dir = app_data_dir.join("workspaces");

    workspace_service::create_workspace(&workspaces_base_dir, name, description).await
}

#[tauri::command]
pub async fn get_workspace(id: String) -> Result<Option<Workspace>, String> {
    workspace_service::get_workspace(id).await
}

#[tauri::command]
pub async fn list_workspaces() -> Result<Vec<Workspace>, String> {
    workspace_service::list_workspaces().await
}

#[tauri::command]
pub async fn update_workspace(
    id: String,
    name: Option<String>,
    description: Option<String>,
) -> Result<Workspace, String> {
    workspace_service::update_workspace(id, name, description).await
}

#[tauri::command]
pub async fn delete_workspace(id: String) -> Result<(), String> {
    workspace_service::delete_workspace(id).await
}

#[tauri::command]
pub async fn list_workspaces_for_display() -> Result<Vec<WorkspaceDisplay>, String> {
    workspace_service::list_workspaces_for_display().await
}
