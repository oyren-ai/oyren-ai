use crate::adapters::db::models::WorkspaceFileBookmark;
use crate::services::bookmark_service;

#[tauri::command]
pub async fn create_bookmark(
    workspace_id: String,
    workspace_file_id: String,
    bookmark_page: i32,
    bookmark_description: String,
    metadata: Option<String>,
) -> Result<WorkspaceFileBookmark, String> {
    bookmark_service::create_bookmark(
        workspace_id,
        workspace_file_id,
        bookmark_page,
        bookmark_description,
        metadata,
    )
    .await
}

#[tauri::command]
pub async fn delete_bookmark(id: String) -> Result<(), String> {
    bookmark_service::delete_bookmark(id).await
}

#[tauri::command]
pub async fn list_bookmarks_by_file(
    workspace_file_id: String,
) -> Result<Vec<WorkspaceFileBookmark>, String> {
    bookmark_service::list_bookmarks_by_file(workspace_file_id).await
}

#[tauri::command]
pub async fn list_bookmarks_by_workspace(
    workspace_id: String,
) -> Result<Vec<WorkspaceFileBookmark>, String> {
    bookmark_service::list_bookmarks_by_workspace(workspace_id).await
}