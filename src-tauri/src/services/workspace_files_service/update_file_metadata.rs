use crate::adapters::db::{repositories, sqlite};
use crate::errors::PdfServiceError;

/// Updates the metadata JSON field for a workspace file
pub async fn update_file_metadata(
    file_id: &str,
    metadata: Option<String>,
) -> Result<(), PdfServiceError> {
    let pool = sqlite::get_db_pool().map_err(|e| PdfServiceError::DatabaseError {
        message: format!("Database error: {}", e),
    })?;

    repositories::workspace_files::update_metadata(pool, file_id, metadata)
        .await
        .map_err(|e| PdfServiceError::DatabaseError {
            message: format!("Failed to update metadata: {}", e),
        })?;

    Ok(())
}
