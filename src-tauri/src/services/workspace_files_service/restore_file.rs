use crate::adapters::db::repositories;
use crate::errors::PdfServiceError;

/// Restore a soft-deleted file back to 'active' status.
/// The caller is responsible for re-downloading the file content from cloud before calling this.
pub async fn restore_workspace_file(workspace_file_id: &str) -> Result<(), PdfServiceError> {
    repositories::workspace_files::restore_file(workspace_file_id)
        .await
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("Failed to restore file: {}", e),
        })?;

    Ok(())
}
