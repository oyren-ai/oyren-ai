use crate::adapters::db::{repositories, sqlite};
use crate::errors::PdfServiceError;
use std::path::Path;

/// Update the content of a workspace file by its ID
/// Writes the new content to disk
pub async fn update_file_content(file_id: &str, content: String) -> Result<(), PdfServiceError> {
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

    // Step 4: Write new content to file
    std::fs::write(file_path, content).map_err(|e| PdfServiceError::FileSystemError {
        message: format!("Failed to write file: {}", e),
    })?;

    Ok(())
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
    async fn test_update_file_content_success() {
        let (_file_temp_dir, file_path) =
            setup_test_db_with_file("file-update-1", "update.txt").await;

        // Create file with initial content
        fs::write(&file_path, "Initial content").expect("Failed to create test file");

        // Update content
        let result = update_file_content("file-update-1", "Updated content".to_string()).await;
        assert!(result.is_ok());

        // Verify content was updated
        let content = fs::read_to_string(&file_path).expect("Failed to read updated file");
        assert_eq!(content, "Updated content");
    }

    #[tokio::test]
    async fn test_update_file_content_with_multiline() {
        let (_file_temp_dir, file_path) =
            setup_test_db_with_file("file-update-2", "multiline.txt").await;

        fs::write(&file_path, "Old content").expect("Failed to create test file");

        let new_content = "Line 1\nLine 2\nLine 3\nLine 4";
        let result = update_file_content("file-update-2", new_content.to_string()).await;
        assert!(result.is_ok());

        let content = fs::read_to_string(&file_path).expect("Failed to read file");
        assert_eq!(content, new_content);
    }

    #[tokio::test]
    async fn test_update_file_content_file_not_in_database() {
        let (_file_temp_dir, _file_path) =
            setup_test_db_with_file("file-update-3", "existing.txt").await;

        let result = update_file_content("nonexistent-file-id", "Content".to_string()).await;

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
    async fn test_update_file_content_file_not_on_disk() {
        let (_file_temp_dir, _file_path) =
            setup_test_db_with_file("file-update-4", "missing.txt").await;

        // Don't create the actual file - exists in DB but not on disk

        let result = update_file_content("file-update-4", "New content".to_string()).await;

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
    async fn test_update_file_content_empty_content() {
        let (_file_temp_dir, file_path) =
            setup_test_db_with_file("file-update-5", "toempty.txt").await;

        fs::write(&file_path, "Some content").expect("Failed to create test file");

        let result = update_file_content("file-update-5", "".to_string()).await;
        assert!(result.is_ok());

        let content = fs::read_to_string(&file_path).expect("Failed to read file");
        assert_eq!(content, "");
    }

    #[tokio::test]
    async fn test_update_file_content_large_content() {
        let (_file_temp_dir, file_path) =
            setup_test_db_with_file("file-update-6", "large.txt").await;

        fs::write(&file_path, "Small").expect("Failed to create test file");

        // Create large content (10KB)
        let large_content = "x".repeat(10_000);
        let result = update_file_content("file-update-6", large_content.clone()).await;
        assert!(result.is_ok());

        let content = fs::read_to_string(&file_path).expect("Failed to read file");
        assert_eq!(content, large_content);
        assert_eq!(content.len(), 10_000);
    }

    #[tokio::test]
    async fn test_update_file_content_overwrites_existing() {
        let (_file_temp_dir, file_path) =
            setup_test_db_with_file("file-update-7", "overwrite.txt").await;

        // Write longer initial content
        fs::write(&file_path, "This is a long initial content").expect("Failed to create test file");

        // Update with shorter content
        let result = update_file_content("file-update-7", "Short".to_string()).await;
        assert!(result.is_ok());

        // Verify file was completely overwritten (not appended)
        let content = fs::read_to_string(&file_path).expect("Failed to read file");
        assert_eq!(content, "Short");
        assert_eq!(content.len(), 5);
    }

    #[tokio::test]
    async fn test_update_file_content_with_special_characters() {
        let (_file_temp_dir, file_path) =
            setup_test_db_with_file("file-update-8", "special.txt").await;

        fs::write(&file_path, "Normal").expect("Failed to create test file");

        let special_content = "Hello 🌍!\nTab:\t\nQuote: \"test\"\nBackslash: \\\nUnicode: 你好";
        let result = update_file_content("file-update-8", special_content.to_string()).await;
        assert!(result.is_ok());

        let content = fs::read_to_string(&file_path).expect("Failed to read file");
        assert_eq!(content, special_content);
    }
}
