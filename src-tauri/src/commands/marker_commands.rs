use crate::errors::pdf_service_error_to_string;
use crate::services::marker_conversion::{self, ConversionResult};
use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn convert_pdf_with_marker(
    app: AppHandle,
    workspace_id: String,
    workspace_file_id: String,
    auth_token: String,
    estimated_pages: Option<u32>,
    api_base_url: Option<String>,
) -> Result<ConversionResult, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let workspaces_base_dir = app_data_dir.join("workspaces");

    marker_conversion::convert_pdf_to_markdown(
        &app,
        &workspaces_base_dir,
        &workspace_id,
        &workspace_file_id,
        &auth_token,
        estimated_pages,
        api_base_url.as_deref(),
    )
    .await
    .map_err(|e| pdf_service_error_to_string(&e))
}
