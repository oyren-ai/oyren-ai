use crate::adapters::db::repositories::workspace_files;
use crate::adapters::db::sqlite;
use crate::errors::PdfServiceError;
use crate::services::document::get_workspace_file_content;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Response type for get_workspace_file with optional content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceFileWithContent {
    pub id: String,
    pub workspace_id: String,
    pub file_path: String,
    pub file_name: String,
    pub added_at: String,
    pub last_accessed_at: String,
    pub is_visible: bool,
    pub is_read_only: bool,
    pub metadata: Option<String>,
    pub content: Option<String>,
}

/// Get a workspace file by ID, optionally including extracted content
pub async fn get_workspace_file(
    workspaces_base_dir: &Path,
    file_id: &str,
    with_content: bool,
) -> Result<WorkspaceFileWithContent, PdfServiceError> {
    let pool = sqlite::get_db_pool().map_err(|e| PdfServiceError::DatabaseError { message: e })?;

    // Get file metadata from database
    let file = workspace_files::get_workspace_file(pool, file_id)
        .await
        .map_err(|e| PdfServiceError::DatabaseError { message: e })?;

    // Get content if requested
    let content = if with_content {
        match get_workspace_file_content(workspaces_base_dir, file_id).await {
            Ok(text) => Some(text),
            Err(_) => None, // Content extraction not supported or failed
        }
    } else {
        None
    };

    Ok(WorkspaceFileWithContent {
        id: file.id,
        workspace_id: file.workspace_id,
        file_path: file.file_path,
        file_name: file.file_name,
        added_at: file.added_at.to_rfc3339(),
        last_accessed_at: file.last_accessed_at.to_rfc3339(),
        is_visible: file.is_visible,
        is_read_only: file.is_read_only,
        metadata: file.metadata,
        content,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_workspace_file_requires_db() {
        let temp_dir = tempfile::TempDir::new().unwrap();
        let result = get_workspace_file(temp_dir.path(), "nonexistent", false).await;
        assert!(result.is_err());
    }
}
