use std::path::Path;

use tracing::info;

use crate::adapters::db::{repositories, WorkspaceFile};
use crate::adapters::os::file;
use crate::errors::PdfServiceError;
pub async fn list_workspace_files(
    workspaces_base_dir: &Path,
    workspace_id: &str,
    is_not_intersection: Option<bool>,
) -> Result<Vec<WorkspaceFile>, String> {
    // Step 1: Get files from database
    let mut workspace_files = repositories::workspace_files::list_workspace_files(workspace_id)
        .await
        .map_err(|e| format!("Failed to get workspace files from DB: {:?}", e))?;
    info!("✓ Got {} files from DB", workspace_files.len());

    // Step 2: Get files from local folder
    let workspace_files_folder = workspaces_base_dir.join(workspace_id);
    let workspace_files_from_local = file::get_all_files(&workspace_files_folder)
        .map_err(|e| format!("Failed to get workspace directory: {:?}", e))?;

    if !(is_not_intersection.is_some() && is_not_intersection.unwrap_or(false)) {
        workspace_files.retain(|file| {
            workspace_files_from_local
                .iter()
                .any(|local_file| local_file.path.display().to_string() == file.file_path)
        });
    }

    Ok(workspace_files)
}
#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::sqlite;
    use crate::adapters::db::test_utils::init_test_db;
    use chrono::Utc;
    use std::fs;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_get_workspace_files_not_intersection_true_returns_all_db_files() {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();

        let workspace_id = uuid::Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at)
               VALUES (?, ?, ?, ?, ?)"#,
        )
        .bind(&workspace_id)
        .bind("Workspace All")
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .unwrap();

        let temp_dir = TempDir::new().unwrap();
        let workspace_path = temp_dir.path().join(&workspace_id);
        fs::create_dir_all(&workspace_path).unwrap();

        repositories::workspace_files::add_file_to_workspace(
            workspace_id.clone(),
            workspace_path
                .join("db_file1.pdf")
                .to_str()
                .unwrap()
                .to_string(),
            "db_file1.pdf".into(),
        )
        .await
        .unwrap();

        repositories::workspace_files::add_file_to_workspace(
            workspace_id.clone(),
            workspace_path
                .join("db_file2.pdf")
                .to_str()
                .unwrap()
                .to_string(),
            "db_file2.pdf".into(),
        )
        .await
        .unwrap();

        // Only one exists locally
        fs::write(workspace_path.join("db_file1.pdf"), b"test").unwrap();

        // Because is_not_intersection = true → should NOT filter
        let result = list_workspace_files(temp_dir.path(), &workspace_id, Some(true))
            .await
            .unwrap();

        assert_eq!(result.len(), 2);
        assert!(result.iter().any(|f| f.file_name == "db_file1.pdf"));
        assert!(result.iter().any(|f| f.file_name == "db_file2.pdf"));
    }

    #[tokio::test]
    async fn test_get_workspace_files_not_intersection_false_filters_local_only() {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();

        let workspace_id = uuid::Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at)
               VALUES (?, ?, ?, ?, ?)"#,
        )
        .bind(&workspace_id)
        .bind("Workspace Filtered")
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .unwrap();

        let temp_dir = TempDir::new().unwrap();
        let workspace_path = temp_dir.path().join(&workspace_id);
        fs::create_dir_all(&workspace_path).unwrap();

        let db_file1 = workspace_path.join("local.pdf");
        let db_file2 = workspace_path.join("not_local.pdf");

        repositories::workspace_files::add_file_to_workspace(
            workspace_id.clone(),
            db_file1.to_str().unwrap().to_string(),
            "local.pdf".into(),
        )
        .await
        .unwrap();

        repositories::workspace_files::add_file_to_workspace(
            workspace_id.clone(),
            db_file2.to_str().unwrap().to_string(),
            "not_local.pdf".into(),
        )
        .await
        .unwrap();

        // Only local.pdf actually exists
        fs::write(&db_file1, b"exists").unwrap();

        // Because is_not_intersection = false → should FILTER
        let result = list_workspace_files(temp_dir.path(), &workspace_id, Some(false))
            .await
            .unwrap();

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].file_name, "local.pdf");
    }

    #[tokio::test]
    async fn test_get_workspace_files_empty_workspace() {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();

        let workspace_id = uuid::Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at)
               VALUES (?, ?, ?, ?, ?)"#,
        )
        .bind(&workspace_id)
        .bind("Empty Workspace")
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .unwrap();

        let temp_dir = TempDir::new().unwrap();
        fs::create_dir_all(temp_dir.path().join(&workspace_id)).unwrap();

        // Default None acts like filtering mode (intersection)
        let result = list_workspace_files(temp_dir.path(), &workspace_id, None)
            .await
            .unwrap();

        assert!(result.is_empty());
    }
}
