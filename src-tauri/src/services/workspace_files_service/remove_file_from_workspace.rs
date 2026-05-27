use crate::adapters::db::{repositories, sqlite};
use crate::adapters::os::file;
use crate::errors::PdfServiceError;
use std::path::Path;

/// Remove a file from a workspace
/// Deletes both the file, its parent directory (if inside workspace_files/), and database entry
pub async fn remove_file_from_workspace(workspace_file_id: &str) -> Result<(), PdfServiceError> {
    // Step 1: Get database connection
    let pool = sqlite::get_db_pool().map_err(|e| PdfServiceError::ProcessingError {
        message: format!("Database error: {}", e),
    })?;

    // Step 2: Get file info from database
    let workspace_file = repositories::workspace_files::get_workspace_file(pool, workspace_file_id)
        .await
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("File not found in database: {}", e),
        })?;

    // Step 3: Delete file from filesystem if it exists
    let file_path = Path::new(&workspace_file.file_path);
    if file::file_exists(&workspace_file.file_path) {
        file::delete_file(&workspace_file.file_path)
            .map_err(|e| PdfServiceError::FileError { source: e })?;
    }

    // Step 4: Clean up parent directory if inside workspace_files/
    cleanup_workspace_files_dir(file_path);

    // Step 5: Remove from database
    repositories::workspace_files::delete_file(pool, workspace_file_id)
        .await
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("Failed to remove file from database: {}", e),
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use std::fs;
    use tempfile::TempDir;

    async fn create_test_workspace_with_id(workspace_id: &str) {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();
        let now = chrono::Utc::now();
        sqlx::query(
            r#"INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at) VALUES (?, ?, ?, ?, ?)"#
        )
        .bind(workspace_id)
        .bind("Test Workspace")
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn test_remove_file_from_workspace_success() {
        let workspace_id = uuid::Uuid::new_v4().to_string();
        create_test_workspace_with_id(&workspace_id).await;

        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.pdf");
        fs::write(&test_file, b"test content").unwrap();

        let workspace_file = repositories::workspace_files::add_file_to_workspace(
            workspace_id.clone(),
            test_file.to_str().unwrap().to_string(),
            "test.pdf".to_string(),
        )
        .await
        .unwrap();

        assert!(test_file.exists());

        let result = remove_file_from_workspace(&workspace_file.id).await;
        assert!(result.is_ok());

        assert!(!test_file.exists());

        let files = repositories::workspace_files::list_workspace_files(&workspace_id)
            .await
            .unwrap();
        assert!(files.is_empty());
    }

    #[tokio::test]
    async fn test_remove_file_cleans_up_workspace_files_dir() {
        let workspace_id = uuid::Uuid::new_v4().to_string();
        create_test_workspace_with_id(&workspace_id).await;

        let temp_dir = TempDir::new().unwrap();
        let file_id = "test-file-id";
        let ws_files_dir = temp_dir.path().join("workspace_files").join(file_id);
        fs::create_dir_all(&ws_files_dir).unwrap();

        let test_file = ws_files_dir.join("test.pdf");
        fs::write(&test_file, b"test content").unwrap();

        let workspace_file = repositories::workspace_files::add_file_to_workspace(
            workspace_id.clone(),
            test_file.to_str().unwrap().to_string(),
            "test.pdf".to_string(),
        )
        .await
        .unwrap();

        let result = remove_file_from_workspace(&workspace_file.id).await;
        assert!(result.is_ok());

        assert!(!test_file.exists());
        assert!(!ws_files_dir.exists());
    }

    #[tokio::test]
    async fn test_remove_file_not_found() {
        init_test_db().await;

        let result = remove_file_from_workspace("non_existent_id").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_remove_file_already_deleted() {
        let workspace_id = uuid::Uuid::new_v4().to_string();
        create_test_workspace_with_id(&workspace_id).await;

        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.pdf");
        fs::write(&test_file, b"test content").unwrap();

        let workspace_file = repositories::workspace_files::add_file_to_workspace(
            workspace_id.clone(),
            test_file.to_str().unwrap().to_string(),
            "test.pdf".to_string(),
        )
        .await
        .unwrap();

        fs::remove_file(&test_file).unwrap();
        assert!(!test_file.exists());

        let result = remove_file_from_workspace(&workspace_file.id).await;
        assert!(result.is_ok());

        let files = repositories::workspace_files::list_workspace_files(&workspace_id)
            .await
            .unwrap();
        assert!(files.is_empty());
    }
}
