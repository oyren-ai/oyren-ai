use crate::adapters::db::{repositories, sqlite};
use crate::adapters::os::file;
use crate::errors::PdfServiceError;

/// Remove a PDF file from a workspace
/// Deletes both the file and database entry
pub async fn remove_pdf_from_workspace(
    workspace_file_id: &str,
) -> Result<(), PdfServiceError> {
    // Step 1: Get database connection
    let pool = sqlite::get_db_pool().map_err(|e| PdfServiceError::ProcessingError {
        message: format!("Database error: {}", e),
    })?;

    // Step 2: Get file info from database
    let workspace_file =
        repositories::workspace_files::get_file_by_id(pool, workspace_file_id)
            .await
            .map_err(|e| PdfServiceError::ProcessingError {
                message: format!("File not found in database: {}", e),
            })?;

    // Step 3: Delete file from filesystem if it exists
    if file::file_exists(&workspace_file.file_path) {
        file::delete_file(&workspace_file.file_path).map_err(|e| PdfServiceError::FileError {
            source: e,
        })?;
    }

    // Step 4: Remove from database
    repositories::workspace_files::delete_file(pool, workspace_file_id)
        .await
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("Failed to remove file from database: {}", e),
        })?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use std::fs;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_remove_pdf_from_workspace_success() {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();

        // Create workspace first
        let workspace_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        sqlx::query(
            r#"INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at) VALUES (?, ?, ?, ?, ?)"#
        )
        .bind(&workspace_id)
        .bind("Test Workspace")
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .unwrap();

        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.pdf");
        fs::write(&test_file, b"test content").unwrap();

        // Add file to workspace
        let workspace_file = repositories::workspace_files::add_file_to_workspace(
            pool,
            workspace_id.clone(),
            test_file.to_str().unwrap().to_string(),
            "test.pdf".to_string(),
        )
        .await
        .unwrap();

        assert!(test_file.exists());

        // Remove file
        let result = remove_pdf_from_workspace(&workspace_file.id).await;
        assert!(result.is_ok());

        // Verify file deleted
        assert!(!test_file.exists());

        // Verify database entry removed
        let files = repositories::workspace_files::get_files_by_workspace_id(pool, &workspace_id)
            .await
            .unwrap();
        assert!(files.is_empty());
    }

    #[tokio::test]
    async fn test_remove_pdf_file_not_found() {
        init_test_db().await;

        let result = remove_pdf_from_workspace("non_existent_id").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_remove_pdf_file_already_deleted() {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();

        // Create workspace first
        let workspace_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        sqlx::query(
            r#"INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at) VALUES (?, ?, ?, ?, ?)"#
        )
        .bind(&workspace_id)
        .bind("Test Workspace 2")
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .unwrap();

        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.pdf");
        fs::write(&test_file, b"test content").unwrap();

        // Add file to workspace
        let workspace_file = repositories::workspace_files::add_file_to_workspace(
            pool,
            workspace_id.clone(),
            test_file.to_str().unwrap().to_string(),
            "test.pdf".to_string(),
        )
        .await
        .unwrap();

        // Delete file manually
        fs::remove_file(&test_file).unwrap();
        assert!(!test_file.exists());

        // Remove should still succeed (idempotent)
        let result = remove_pdf_from_workspace(&workspace_file.id).await;
        assert!(result.is_ok());

        // Verify database entry removed
        let files = repositories::workspace_files::get_files_by_workspace_id(pool, &workspace_id)
            .await
            .unwrap();
        assert!(files.is_empty());
    }
}
