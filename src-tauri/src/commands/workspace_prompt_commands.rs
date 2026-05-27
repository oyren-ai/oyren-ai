use crate::adapters::db::models::WorkspacePrompt;
use crate::errors::pdf_service_error_to_string;
use crate::services::workspace_prompt_service;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn create_workspace_prompt(
    workspace_id: String,
    title: String,
    blocks: String,
) -> Result<WorkspacePrompt, String> {
    workspace_prompt_service::create_prompt(workspace_id, title, blocks).await
}

#[tauri::command]
pub async fn list_workspace_prompts(
    workspace_id: String,
) -> Result<Vec<WorkspacePrompt>, String> {
    workspace_prompt_service::list_prompts(workspace_id).await
}

#[tauri::command]
pub async fn update_workspace_prompt(
    prompt_id: String,
    title: String,
    blocks: String,
) -> Result<(), String> {
    workspace_prompt_service::update_prompt(prompt_id, title, blocks).await
}

#[tauri::command]
pub async fn delete_workspace_prompt(prompt_id: String) -> Result<(), String> {
    workspace_prompt_service::delete_prompt(prompt_id).await
}

#[tauri::command]
pub async fn resolve_workspace_prompt(
    app: AppHandle,
    prompt_id: String,
) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    let workspaces_base_dir = app_data_dir.join("workspaces");

    workspace_prompt_service::resolve_prompt(&workspaces_base_dir, &prompt_id)
        .await
        .map_err(|e| pdf_service_error_to_string(&e))
}
