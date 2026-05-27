use crate::adapters::db::models::WorkspaceFile;
use crate::adapters::db::sqlite;

/// List active files for a workspace (excludes soft-deleted).
pub async fn list_workspace_files(workspace_id: &str) -> Result<Vec<WorkspaceFile>, String> {
    let pool = sqlite::get_db_pool()?;

    sqlx::query_as::<_, WorkspaceFile>(
        r#"
        SELECT * FROM workspace_files
        WHERE workspace_id = ? AND is_visible = 1 AND local_status = 'active'
        ORDER BY added_at DESC
        "#,
    )
    .bind(workspace_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list files for workspace: {}", e))
}

/// List ALL files including soft-deleted (used by sync engine to avoid re-downloading).
pub async fn list_all_workspace_files(workspace_id: &str) -> Result<Vec<WorkspaceFile>, String> {
    let pool = sqlite::get_db_pool()?;

    sqlx::query_as::<_, WorkspaceFile>(
        r#"
        SELECT * FROM workspace_files
        WHERE workspace_id = ? AND is_visible = 1
        ORDER BY added_at DESC
        "#,
    )
    .bind(workspace_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list all files for workspace: {}", e))
}

/// List only soft-deleted files (synced files removed locally; cloud copy available for restore).
pub async fn list_deleted_workspace_files(workspace_id: &str) -> Result<Vec<WorkspaceFile>, String> {
    let pool = sqlite::get_db_pool()?;

    sqlx::query_as::<_, WorkspaceFile>(
        r#"
        SELECT * FROM workspace_files
        WHERE workspace_id = ? AND local_status = 'local_deleted'
        ORDER BY added_at DESC
        "#,
    )
    .bind(workspace_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list deleted files for workspace: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::repositories::workspace_files::add_file_to_workspace;
    use crate::adapters::db::test_utils::init_test_db;

    async fn create_test_workspace(workspace_id: &str) {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();

        sqlx::query(
            r#"
            INSERT OR IGNORE INTO workspaces (id, name, created_at, updated_at, last_accessed_at)
            VALUES (?, ?, datetime('now'), datetime('now'), datetime('now'))
            "#,
        )
        .bind(workspace_id)
        .bind("Test Workspace")
        .execute(pool)
        .await
        .expect("Failed to create test workspace");
    }

    #[tokio::test]
    async fn test_get_files_by_workspace_id_empty() {
        let workspace_id = "workspace-get-empty";
        create_test_workspace(workspace_id).await;

        let result = list_workspace_files(workspace_id).await;

        assert!(result.is_ok());
        let files = result.unwrap();
        assert_eq!(files.len(), 0);
    }

    #[tokio::test]
    async fn test_get_files_by_workspace_id_multiple_files() {
        let workspace_id = "workspace-get-multi";
        create_test_workspace(workspace_id).await;

        // Add multiple files
        add_file_to_workspace(
            workspace_id.to_string(),
            "/path/to/file1.pdf".to_string(),
            "file1.pdf".to_string(),
        )
        .await
        .unwrap();

        add_file_to_workspace(
            workspace_id.to_string(),
            "/path/to/file2.pdf".to_string(),
            "file2.pdf".to_string(),
        )
        .await
        .unwrap();

        add_file_to_workspace(
            workspace_id.to_string(),
            "/path/to/file3.pdf".to_string(),
            "file3.pdf".to_string(),
        )
        .await
        .unwrap();

        let result = list_workspace_files(workspace_id).await;

        assert!(result.is_ok());
        let files = result.unwrap();
        assert_eq!(files.len(), 3);

        // Verify files are ordered by added_at (most recent first)
        assert_eq!(files[0].file_name, "file3.pdf");
        assert_eq!(files[1].file_name, "file2.pdf");
        assert_eq!(files[2].file_name, "file1.pdf");
    }

    #[tokio::test]
    async fn test_get_files_by_workspace_id_only_visible() {
        let workspace_id = "workspace-get-visibility";
        create_test_workspace(workspace_id).await;
        let pool = sqlite::get_db_pool().unwrap();

        // Add visible file
        add_file_to_workspace(
            workspace_id.to_string(),
            "/path/to/visible.pdf".to_string(),
            "visible.pdf".to_string(),
        )
        .await
        .unwrap();

        // Add hidden file manually
        sqlx::query(
            r#"
            INSERT INTO workspace_files (id, workspace_id, file_path, file_name, is_visible, is_read_only)
            VALUES (?, ?, ?, ?, 0, 1)
            "#,
        )
        .bind("hidden-file-id-get")
        .bind(workspace_id)
        .bind("/path/to/hidden.pdf")
        .bind("hidden.pdf")
        .execute(pool)
        .await
        .unwrap();

        let result = list_workspace_files(workspace_id).await;

        assert!(result.is_ok());
        let files = result.unwrap();

        // Should only return visible files
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].file_name, "visible.pdf");
    }
}
