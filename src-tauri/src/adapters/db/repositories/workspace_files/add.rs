use crate::adapters::db::models::WorkspaceFile;
use crate::adapters::db::sqlite;
use chrono::Utc;
use uuid::Uuid;

use super::find_by_workspace_and_path;

pub async fn add_file_to_workspace(
    workspace_id: String,
    file_path: String,
    file_name: String,
) -> Result<WorkspaceFile, String> {
    add_file_to_workspace_with_metadata(workspace_id, file_path, file_name, None).await
}

pub async fn add_file_to_workspace_with_id(
    id: String,
    workspace_id: String,
    file_path: String,
    file_name: String,
) -> Result<WorkspaceFile, String> {
    let pool = sqlite::get_db_pool()?;

    if let Some(existing_file) = find_by_workspace_and_path(pool, &workspace_id, &file_path).await?
    {
        return Ok(existing_file);
    }

    let now = Utc::now();
    let workspace_file = WorkspaceFile {
        id,
        workspace_id,
        file_path,
        file_name,
        added_at: now,
        last_accessed_at: now,
        is_visible: true,
        is_read_only: true,
        metadata: None,
        sync_id: None,
        cloud_file_uuid: None,
        content_hash: None,
        last_synced_at: None,
        local_status: "active".to_string(),
    };

    insert_workspace_file(pool, &workspace_file).await?;
    Ok(workspace_file)
}

pub async fn add_file_to_workspace_with_metadata(
    workspace_id: String,
    file_path: String,
    file_name: String,
    metadata: Option<String>,
) -> Result<WorkspaceFile, String> {
    let pool = sqlite::get_db_pool()?;

    if let Some(existing_file) = find_by_workspace_and_path(pool, &workspace_id, &file_path).await?
    {
        return Ok(existing_file);
    }

    let now = Utc::now();
    let id = Uuid::new_v4().to_string();

    let workspace_file = WorkspaceFile {
        id,
        workspace_id,
        file_path,
        file_name,
        added_at: now,
        last_accessed_at: now,
        is_visible: true,
        is_read_only: true,
        metadata,
        sync_id: None,
        cloud_file_uuid: None,
        content_hash: None,
        last_synced_at: None,
        local_status: "active".to_string(),
    };

    insert_workspace_file(pool, &workspace_file).await?;
    Ok(workspace_file)
}

async fn insert_workspace_file(
    pool: &sqlx::SqlitePool,
    wf: &WorkspaceFile,
) -> Result<(), String> {
    sqlx::query(
        r#"
        INSERT INTO workspace_files (
            id, workspace_id, file_path, file_name, added_at,
            last_accessed_at, is_visible, is_read_only, metadata,
            sync_id, cloud_file_uuid, content_hash, last_synced_at,
            local_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&wf.id)
    .bind(&wf.workspace_id)
    .bind(&wf.file_path)
    .bind(&wf.file_name)
    .bind(&wf.added_at)
    .bind(&wf.last_accessed_at)
    .bind(wf.is_visible)
    .bind(wf.is_read_only)
    .bind(&wf.metadata)
    .bind(&wf.sync_id)
    .bind(&wf.cloud_file_uuid)
    .bind(&wf.content_hash)
    .bind(&wf.last_synced_at)
    .bind(&wf.local_status)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to add file to workspace: {}", e))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
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
    async fn test_add_file_to_workspace_success() {
        let workspace_id = "workspace-add-123";
        create_test_workspace(workspace_id).await;

        let result = add_file_to_workspace(
            workspace_id.to_string(),
            "/path/to/document.pdf".to_string(),
            "document.pdf".to_string(),
        )
        .await;

        assert!(result.is_ok());
        let file = result.unwrap();

        assert_eq!(file.workspace_id, workspace_id);
        assert_eq!(file.file_path, "/path/to/document.pdf");
        assert_eq!(file.file_name, "document.pdf");
        assert!(file.is_visible);
        assert!(file.is_read_only);
        assert!(file.metadata.is_none());
    }

    #[tokio::test]
    async fn test_add_file_to_workspace_with_metadata() {
        let workspace_id = "workspace-add-456";
        create_test_workspace(workspace_id).await;

        let metadata = r#"{"page_count": 10, "file_size": 1024}"#;

        let result = add_file_to_workspace_with_metadata(
            workspace_id.to_string(),
            "/path/to/report.pdf".to_string(),
            "report.pdf".to_string(),
            Some(metadata.to_string()),
        )
        .await;

        assert!(result.is_ok());
        let file = result.unwrap();

        assert_eq!(file.metadata, Some(metadata.to_string()));
    }

    #[tokio::test]
    async fn test_add_file_to_workspace_nonexistent_workspace() {
        init_test_db().await;

        let result = add_file_to_workspace(
            "nonexistent-workspace-add".to_string(),
            "/path/to/file.pdf".to_string(),
            "file.pdf".to_string(),
        )
        .await;

        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .contains("FOREIGN KEY constraint failed"));
    }

    #[tokio::test]
    async fn test_add_file_to_workspace_duplicate_returns_existing() {
        let workspace_id = "workspace-add-duplicate-789";
        create_test_workspace(workspace_id).await;

        // Add file first time
        let result1 = add_file_to_workspace(
            workspace_id.to_string(),
            "/path/to/duplicate.pdf".to_string(),
            "duplicate.pdf".to_string(),
        )
        .await;

        assert!(result1.is_ok());
        let file1 = result1.unwrap();

        // Add same file second time (should return existing)
        let result2 = add_file_to_workspace(
            workspace_id.to_string(),
            "/path/to/duplicate.pdf".to_string(),
            "duplicate.pdf".to_string(),
        )
        .await;

        assert!(result2.is_ok());
        let file2 = result2.unwrap();

        // Should be the same file (same ID)
        assert_eq!(file1.id, file2.id);
        assert_eq!(file1.workspace_id, file2.workspace_id);
        assert_eq!(file1.file_path, file2.file_path);
        assert_eq!(file1.added_at, file2.added_at);
    }

    #[tokio::test]
    async fn test_add_file_to_workspace_with_id_success() {
        let workspace_id = "workspace-add-with-id-001";
        create_test_workspace(workspace_id).await;

        let custom_id = "custom-uuid-123".to_string();
        let result = add_file_to_workspace_with_id(
            custom_id.clone(),
            workspace_id.to_string(),
            "/path/to/custom.pdf".to_string(),
            "custom.pdf".to_string(),
        )
        .await;

        assert!(result.is_ok());
        let file = result.unwrap();

        assert_eq!(file.id, custom_id);
        assert_eq!(file.workspace_id, workspace_id);
        assert_eq!(file.file_path, "/path/to/custom.pdf");
        assert_eq!(file.file_name, "custom.pdf");
        assert!(file.is_visible);
        assert!(file.is_read_only);
        assert!(file.metadata.is_none());
    }
}
