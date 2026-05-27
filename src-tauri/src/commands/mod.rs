mod ai_agent_commands;
mod ai_provider_commands;
mod ai_provider_key_commands;
mod ai_provider_model_commands;
mod arxiv_commands;
mod auth_commands;
mod bookmark_commands;
mod cancel_ai_request;
mod conversation_commands;
mod marker_commands;
mod register_commands;
mod sync_commands;
mod updater_commands;
mod workspace_commands;
mod workspace_file_commands;
mod workspace_prompt_commands;

pub use ai_agent_commands::*;
pub use ai_provider_commands::*;
pub use ai_provider_key_commands::*;
pub use ai_provider_model_commands::*;
pub use arxiv_commands::*;
pub use auth_commands::*;
pub use bookmark_commands::*;
pub use cancel_ai_request::*;
pub use conversation_commands::*;
pub use marker_commands::*;
pub use register_commands::register_commands;
pub use sync_commands::*;
pub use updater_commands::*;
pub use workspace_commands::*;
pub use workspace_file_commands::*;
pub use workspace_prompt_commands::*;

use crate::adapters::db::WorkspaceFile;
use crate::errors::pdf_service_error_to_string;
use crate::services::document as document_service;
use crate::services::workspace_files_service;
use crate::services::{PdfPageContent, PdfProcessingResult};
use crate::services::document::pdf::{SearchOptions, SearchMatch};
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn read_pdf_file(filepath: String) -> Result<Vec<u8>, String> {
    document_service::pdf::read_pdf_file(&filepath).map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub fn extract_pdf_sync(filepath: String) -> Result<PdfProcessingResult, String> {
    document_service::pdf::extract_pdf_sync(&filepath).map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub fn search_pdf_text(
    pages: Vec<PdfPageContent>,
    query: String,
) -> Result<Vec<(usize, Vec<String>)>, String> {
    document_service::pdf::search_pdf_text(pages, query)
        .map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub fn search_pdf_text_enhanced(
    pages: Vec<PdfPageContent>,
    query: String,
    case_sensitive: bool,
    whole_words: bool,
) -> Result<Vec<SearchMatch>, String> {
    // Note: Tauri v2 expects camelCase in frontend, converts to snake_case automatically
    // But if that doesn't work, we may need to rename parameters to match frontend
    let options = SearchOptions {
        case_sensitive,
        whole_words,
    };
    document_service::pdf::search_pdf_text_enhanced(pages, query, options)
        .map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub async fn create_workspace_note(
    app: AppHandle,
    workspace_id: String,
    note_name: String,
) -> Result<WorkspaceFile, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let workspaces_base_dir = app_data_dir.join("workspaces");

    workspace_files_service::create_note(&workspaces_base_dir, &workspace_id, note_name)
        .await
        .map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub async fn create_workspace_latex_note(
    app: AppHandle,
    workspace_id: String,
    note_name: String,
) -> Result<WorkspaceFile, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let workspaces_base_dir = app_data_dir.join("workspaces");

    workspace_files_service::create_latex_note(&workspaces_base_dir, &workspace_id, note_name)
        .await
        .map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub async fn read_workspace_file(app: AppHandle, file_id: String) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    let workspaces_base_dir = app_data_dir.join("workspaces");
    document_service::get_workspace_file_content(&workspaces_base_dir, &file_id)
        .await
        .map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub async fn update_workspace_file(file_id: String, content: String) -> Result<(), String> {
    workspace_files_service::update_file_content(&file_id, content)
        .await
        .map_err(|e| pdf_service_error_to_string(&e))
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    use std::fs;
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file {}: {}", path, e))
}

#[cfg(test)]
#[path = "commands_test.rs"]
mod tests;
