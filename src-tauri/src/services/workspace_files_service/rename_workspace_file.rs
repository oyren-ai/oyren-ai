use crate::adapters::db::{repositories, sqlite};
use crate::adapters::os::file;
use crate::errors::PdfServiceError;
use std::path::Path;

/// Renames a workspace file
/// Updates both the filesystem and database
/// Works for both old paths (workspace root) and new paths (workspace_files/{file_id}/)
pub async fn rename_workspace_file(
    _workspace_base_dir: &Path,
    workspace_file_id: &str,
    new_file_name: &str,
) -> Result<(), PdfServiceError> {
    let pool = sqlite::get_db_pool().map_err(|e| PdfServiceError::ProcessingError {
        message: format!("Database error: {}", e),
    })?;

    let workspace_file = repositories::workspace_files::get_workspace_file(pool, workspace_file_id)
        .await
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("File not found in database: {}", e),
        })?;

    // Use the file's parent directory to construct new path
    // Works for both old layout (workspace root) and new layout (workspace_files/{id}/)
    let current_path = Path::new(&workspace_file.file_path);
    let parent_dir = current_path.parent().ok_or_else(|| {
        PdfServiceError::ProcessingError {
            message: "Cannot determine parent directory of file".to_string(),
        }
    })?;
    let new_path = parent_dir.join(new_file_name);

    if file::file_exists(&workspace_file.file_path) {
        file::rename_file(
            &workspace_file.file_path,
            new_path
                .to_str()
                .ok_or_else(|| PdfServiceError::ProcessingError {
                    message: "Invalid path encoding".to_string(),
                })?,
        )
        .map_err(|e| PdfServiceError::FileError { source: e })?;
    }

    repositories::workspace_files::rename_file(
        pool,
        workspace_file_id,
        new_path
            .to_str()
            .ok_or_else(|| PdfServiceError::ProcessingError {
                message: "Invalid path encoding".to_string(),
            })?,
        new_file_name,
    )
    .await
    .map_err(|e| PdfServiceError::ProcessingError {
        message: format!("Failed to update file in database: {}", e),
    })?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::repositories;
    use crate::adapters::db::test_utils::init_test_db;
    use std::fs;
    use tempfile::TempDir;

    async fn create_test_workspace_with_id(workspace_id: &str) {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();
        let now = chrono::Utc::now();
        sqlx::query(
            r#"INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at)
               VALUES (?, ?, ?, ?, ?)"#,
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
    async fn test_rename_workspace_file_success() {
        let workspace_id = uuid::Uuid::new_v4().to_string();
        create_test_workspace_with_id(&workspace_id).await;
        let pool = sqlite::get_db_pool().unwrap();

        let workspace_dir = TempDir::new().unwrap();
        let workspace_subdir = workspace_dir.path().join(&workspace_id);
        fs::create_dir(&workspace_subdir).unwrap();

        let test_file = workspace_subdir.join("old.pdf");
        fs::write(&test_file, b"test content").unwrap();

        let workspace_file = repositories::workspace_files::add_file_to_workspace(
            workspace_id.clone(),
            test_file.to_str().unwrap().to_string(),
            "old.pdf".to_string(),
        )
        .await
        .unwrap();

        let result =
            rename_workspace_file(workspace_dir.path(), &workspace_file.id, "new.pdf").await;
        assert!(result.is_ok());

        assert!(!test_file.exists());

        let new_file = workspace_subdir.join("new.pdf");
        assert!(new_file.exists());
        assert_eq!(fs::read_to_string(&new_file).unwrap(), "test content");

        let updated = repositories::workspace_files::get_workspace_file(pool, &workspace_file.id)
            .await
            .unwrap();
        assert_eq!(updated.file_name, "new.pdf");
        assert!(updated.file_path.ends_with("new.pdf"));
    }

    #[tokio::test]
    async fn test_rename_file_in_workspace_files_dir() {
        let workspace_id = uuid::Uuid::new_v4().to_string();
        create_test_workspace_with_id(&workspace_id).await;
        let pool = sqlite::get_db_pool().unwrap();

        let workspace_dir = TempDir::new().unwrap();
        let file_id = "test-file-uuid";
        let file_dir = workspace_dir
            .path()
            .join(&workspace_id)
            .join("workspace_files")
            .join(file_id);
        fs::create_dir_all(&file_dir).unwrap();

        let test_file = file_dir.join("old.pdf");
        fs::write(&test_file, b"test content").unwrap();

        let workspace_file = repositories::workspace_files::add_file_to_workspace(
            workspace_id.clone(),
            test_file.to_str().unwrap().to_string(),
            "old.pdf".to_string(),
        )
        .await
        .unwrap();

        let result =
            rename_workspace_file(workspace_dir.path(), &workspace_file.id, "new.pdf").await;
        assert!(result.is_ok());

        // File should be renamed within the same workspace_files/{file_id}/ dir
        let new_file = file_dir.join("new.pdf");
        assert!(new_file.exists());
        assert!(!test_file.exists());

        let updated = repositories::workspace_files::get_workspace_file(pool, &workspace_file.id)
            .await
            .unwrap();
        assert_eq!(updated.file_name, "new.pdf");
        assert!(updated.file_path.contains("workspace_files"));
        assert!(updated.file_path.ends_with("new.pdf"));
    }

    #[tokio::test]
    async fn test_rename_workspace_file_not_found() {
        init_test_db().await;

        let workspace_dir = TempDir::new().unwrap();
        let result =
            rename_workspace_file(workspace_dir.path(), "non_existent_id", "new.pdf").await;

        assert!(result.is_err());
    }
}
