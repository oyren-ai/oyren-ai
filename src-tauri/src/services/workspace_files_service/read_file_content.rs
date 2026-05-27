use crate::adapters::db::{repositories, sqlite};
use crate::errors::PdfServiceError;
use std::path::Path;

/// Read the content of a workspace file by its ID
/// Returns the file content as a UTF-8 string
pub async fn read_file_content(file_id: &str) -> Result<String, PdfServiceError> {
    // Step 1: Get database connection
    let pool = sqlite::get_db_pool().map_err(|e| PdfServiceError::ProcessingError {
        message: format!("Database error: {}", e),
    })?;

    // Step 2: Get file record from database
    let workspace_file = repositories::workspace_files::get_workspace_file(pool, file_id)
        .await
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("File not found in database: {}", e),
        })?;

    // Step 3: Verify file exists on disk
    let file_path = Path::new(&workspace_file.file_path);
    if !file_path.exists() {
        return Err(PdfServiceError::FileError {
            source: crate::errors::FileError::NotFound {
                path: workspace_file.file_path.clone(),
            },
        });
    }

    // Step 4: Read file content
    let content =
        std::fs::read_to_string(file_path).map_err(|e| PdfServiceError::FileSystemError {
            message: format!("Failed to read file: {}", e),
        })?;

    Ok(content)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::sqlite;
    use chrono::Utc;
    use std::fs;
    use tempfile::TempDir;

    async fn setup_test_db_with_file(
        file_id: &str,
        file_name: &str,
    ) -> (TempDir, String) {
        // Use init_test_db which properly handles the singleton DB_POOL
        crate::adapters::db::test_utils::init_test_db().await;
        let pool = sqlite::get_db_pool().expect("Failed to get DB pool");

        let file_temp_dir = TempDir::new().expect("Failed to create temp directory");
        let file_path = file_temp_dir.path().join(file_name);
        let file_path_str = file_path.to_str().unwrap().to_string();

        // Create workspace with unique ID based on file_id
        let workspace_id = format!("workspace-{}", file_id);
        sqlx::query(
            "INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(&workspace_id)
        .bind("Test Workspace")
        .bind(&Utc::now())
        .bind(&Utc::now())
        .bind(&Utc::now())
        .bind(true)
        .execute(pool)
        .await
        .expect("Failed to create workspace");

        // Insert file record into database
        let now = Utc::now();
        sqlx::query(
            "INSERT INTO workspace_files
             (id, workspace_id, file_path, file_name, added_at, last_accessed_at, is_visible, is_read_only)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(file_id)
        .bind(&workspace_id)
        .bind(&file_path_str)
        .bind(file_name)
        .bind(&now)
        .bind(&now)
        .bind(true)
        .bind(false)
        .execute(pool)
        .await
        .expect("Failed to insert file record");

        (file_temp_dir, file_path_str)
    }

    #[tokio::test]
    async fn test_read_file_content_success() {
        let (_file_temp_dir, file_path) =
            setup_test_db_with_file("file-123", "test.txt").await;

        // Create actual file with content
        fs::write(&file_path, "Hello, World!").expect("Failed to write test file");

        let result = read_file_content("file-123").await;

        assert!(result.is_ok());
        let content = result.unwrap();
        assert_eq!(content, "Hello, World!");
    }

    #[tokio::test]
    async fn test_read_file_content_with_multiline() {
        let (_file_temp_dir, file_path) =
            setup_test_db_with_file("file-multiline", "multiline.txt").await;

        let content = "Line 1\nLine 2\nLine 3";
        fs::write(&file_path, content).expect("Failed to write test file");

        let result = read_file_content("file-multiline").await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), content);
    }

    #[tokio::test]
    async fn test_read_file_content_file_not_in_database() {
        let (_file_temp_dir, _file_path) =
            setup_test_db_with_file("existing-file", "existing.txt").await;

        let result = read_file_content("nonexistent-file-id").await;

        assert!(result.is_err());
        let err = result.unwrap_err();
        match err {
            PdfServiceError::ProcessingError { message } => {
                assert!(message.contains("File not found in database"));
            }
            _ => panic!("Expected ProcessingError for database lookup"),
        }
    }

    #[tokio::test]
    async fn test_read_file_content_file_not_on_disk() {
        let (_file_temp_dir, _file_path) =
            setup_test_db_with_file("file-missing", "missing.txt").await;

        // Don't create the actual file - it exists in DB but not on disk

        let result = read_file_content("file-missing").await;

        assert!(result.is_err());
        let err = result.unwrap_err();
        match err {
            PdfServiceError::FileError { source } => match source {
                crate::errors::FileError::NotFound { path } => {
                    assert!(path.contains("missing.txt"));
                }
                _ => panic!("Expected FileError::NotFound"),
            },
            _ => panic!("Expected FileError"),
        }
    }

    #[tokio::test]
    async fn test_read_file_content_empty_file() {
        let (_file_temp_dir, file_path) =
            setup_test_db_with_file("file-empty", "empty.txt").await;

        fs::write(&file_path, "").expect("Failed to write empty file");

        let result = read_file_content("file-empty").await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "");
    }
}
