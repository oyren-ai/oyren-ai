use sqlx::SqlitePool;

pub async fn delete_workspace(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("UPDATE workspaces SET is_active = 0 WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete workspace: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::CreateWorkspaceRequest;
    use crate::adapters::db::repositories::workspace::{create_workspace, get_workspace_by_id};
    use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
    use tempfile::TempDir;

    async fn setup_test_db() -> (SqlitePool, TempDir) {
        let temp_dir = TempDir::new().expect("Failed to create temp directory");
        let db_path = temp_dir.path().join("test.db");
        let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect(&db_url)
            .await
            .expect("Failed to create test database");

        // Run migrations
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS workspaces (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                is_pinned BOOLEAN NOT NULL DEFAULT 0,
                is_archived BOOLEAN NOT NULL DEFAULT 0,
                is_favourite BOOLEAN NOT NULL DEFAULT 0,
                settings TEXT,
                is_active BOOLEAN NOT NULL DEFAULT 1
            )
            "#,
        )
        .execute(&pool)
        .await
        .expect("Failed to create workspaces table");

        (pool, temp_dir)
    }

    #[tokio::test]
    async fn test_delete_workspace_success() {
        let (pool, _temp_dir) = setup_test_db().await;

        // Create a workspace
        let request = CreateWorkspaceRequest {
            name: "To Delete".to_string(),
            description: None,
        };
        let created = create_workspace(&pool, request).await.unwrap();

        // Delete it (soft delete)
        let result = delete_workspace(&pool, &created.id).await;
        assert!(result.is_ok());

        // Verify it's marked as inactive
        let workspace = get_workspace_by_id(&pool, &created.id, true).await.unwrap();
        assert!(workspace.is_none());
    }

    #[tokio::test]
    async fn test_delete_workspace_idempotent() {
        let (pool, _temp_dir) = setup_test_db().await;

        // Create and delete a workspace
        let request = CreateWorkspaceRequest {
            name: "To Delete".to_string(),
            description: None,
        };
        let created = create_workspace(&pool, request).await.unwrap();
        delete_workspace(&pool, &created.id).await.unwrap();

        // Delete again should succeed (idempotent)
        let result = delete_workspace(&pool, &created.id).await;
        assert!(result.is_ok());
    }
}
