use crate::adapters::db::{repositories, sqlite};
use crate::adapters::os::file;
use crate::errors::PdfServiceError;
use std::path::Path;

/// Soft-delete a synced file: remove from disk but keep the DB row with local_status='local_deleted'.
/// This preserves the sync linkage so the cloud copy is not re-downloaded on next sync.
pub async fn soft_delete_workspace_file(workspace_file_id: &str) -> Result<(), PdfServiceError> {
    let pool = sqlite::get_db_pool().map_err(|e| PdfServiceError::ProcessingError {
        message: format!("Database error: {}", e),
    })?;

    let workspace_file = repositories::workspace_files::get_workspace_file(pool, workspace_file_id)
        .await
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("File not found in database: {}", e),
        })?;

    let file_path = Path::new(&workspace_file.file_path);
    if file::file_exists(&workspace_file.file_path) {
        file::delete_file(&workspace_file.file_path)
            .map_err(|e| PdfServiceError::FileError { source: e })?;
    }

    cleanup_workspace_files_dir(file_path);

    repositories::workspace_files::soft_delete_file(workspace_file_id)
        .await
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("Failed to soft-delete file in database: {}", e),
        })?;

    Ok(())
}

fn cleanup_workspace_files_dir(file_path: &Path) {
    if let Some(parent) = file_path.parent() {
        let is_inside_workspace_files = parent
            .parent()
            .and_then(|p| p.file_name())
            .map(|name| name == "workspace_files")
            .unwrap_or(false);

        if is_inside_workspace_files {
            let _ = std::fs::remove_dir(parent);
        }
    }
}
