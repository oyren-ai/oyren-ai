use crate::adapters::db::models::WorkspaceFile;
use sqlx::SqlitePool;

pub async fn find_by_workspace_and_path(
    pool: &SqlitePool,
    workspace_id: &str,
    file_path: &str,
) -> Result<Option<WorkspaceFile>, String> {
    sqlx::query_as::<_, WorkspaceFile>(
        r#"
        SELECT
            id,
            workspace_id,
            file_path,
            file_name,
            added_at,
            last_accessed_at,
            is_visible,
            is_read_only,
            metadata,
            sync_id,
            cloud_file_uuid,
            content_hash,
            last_synced_at,
            local_status
        FROM workspace_files
        WHERE
            workspace_id = ?
                AND
            file_path = ?
        "#,
    )
    .bind(workspace_id)
    .bind(file_path)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to find file by workspace_id and file_path: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;
    use tempfile::TempDir;
    use uuid::Uuid;

    async fn setup_test_db() -> (SqlitePool, TempDir) {
        let temp_dir = TempDir::new().expect("Failed to create temp directory");
        let db_path = temp_dir.path().join("test.db");
        let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

        let pool = SqlitePool::connect(&db_url)
            .await
            .expect("Failed to create test database pool");

        // Run migrations
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        (pool, temp_dir)
    }

    #[tokio::test]
    async fn test_find_by_workspace_and_path_found() {
        let (pool, _temp_dir) = setup_test_db().await;
        let workspace_id = Uuid::new_v4().to_string();
        let file_path = "/test/path/file.pdf";
        let file_id = Uuid::new_v4().to_string();

        // Create workspace
        sqlx::query(
            "INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        )
        .bind(&workspace_id)
        .bind("Test Workspace")
        .execute(&pool)
        .await
        .expect("Failed to create workspace");

        // Insert test file
        sqlx::query(
            r#"
            INSERT INTO workspace_files (id, workspace_id, file_path, file_name, added_at, last_accessed_at, is_visible, is_read_only)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1)
            "#
        )
        .bind(&file_id)
        .bind(&workspace_id)
        .bind(file_path)
        .bind("file.pdf")
        .execute(&pool)
        .await
        .expect("Failed to insert test file");

        // Test finding the file
        let result = find_by_workspace_and_path(&pool, &workspace_id, file_path)
            .await
            .expect("Query should succeed");

        assert!(result.is_some());
        let found_file = result.unwrap();
        assert_eq!(found_file.id, file_id);
        assert_eq!(found_file.workspace_id, workspace_id);
        assert_eq!(found_file.file_path, file_path);
    }

    #[tokio::test]
    async fn test_find_by_workspace_and_path_not_found() {
        let (pool, _temp_dir) = setup_test_db().await;
        let workspace_id = Uuid::new_v4().to_string();

        // Create workspace
        sqlx::query(
            "INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        )
        .bind(&workspace_id)
        .bind("Test Workspace")
        .execute(&pool)
        .await
        .expect("Failed to create workspace");

        // Test finding a non-existent file
        let result = find_by_workspace_and_path(&pool, &workspace_id, "/nonexistent/file.pdf")
            .await
            .expect("Query should succeed");

        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_find_by_workspace_and_path_wrong_workspace() {
        let (pool, _temp_dir) = setup_test_db().await;
        let workspace_id_1 = Uuid::new_v4().to_string();
        let workspace_id_2 = Uuid::new_v4().to_string();
        let file_path = "/test/path/file.pdf";

        // Create workspaces
        for ws_id in [&workspace_id_1, &workspace_id_2] {
            sqlx::query(
                "INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            )
            .bind(ws_id)
            .bind("Test Workspace")
            .execute(&pool)
            .await
            .expect("Failed to create workspace");
        }

        // Insert file in workspace 1
        sqlx::query(
            r#"
            INSERT INTO workspace_files (id, workspace_id, file_path, file_name, added_at, last_accessed_at, is_visible, is_read_only)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1)
            "#
        )
        .bind(Uuid::new_v4().to_string())
        .bind(&workspace_id_1)
        .bind(file_path)
        .bind("file.pdf")
        .execute(&pool)
        .await
        .expect("Failed to insert test file");

        // Test finding the file in workspace 2 (should not find it)
        let result = find_by_workspace_and_path(&pool, &workspace_id_2, file_path)
            .await
            .expect("Query should succeed");

        assert!(result.is_none());
    }
}
