use crate::adapters::db::models::Workspace;
use sqlx::SqlitePool;

pub async fn get_workspace_by_id(
    pool: &SqlitePool,
    id: &str,
    is_active: bool,
) -> Result<Option<Workspace>, String> {
    sqlx::query_as::<_, Workspace>("SELECT * FROM workspaces WHERE id = ? AND is_active = ?")
        .bind(id)
        .bind(is_active)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to get workspace: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::CreateWorkspaceRequest;
    use crate::adapters::db::repositories::workspace::create_workspace;
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
    async fn test_get_workspace_by_id_found() {
        let (pool, _temp_dir) = setup_test_db().await;

        // Create a workspace first
        let request = CreateWorkspaceRequest {
            name: "Test Workspace".to_string(),
            description: None,
        };
        let created = create_workspace(&pool, request).await.unwrap();

        // Now get it by ID
        let result = get_workspace_by_id(&pool, &created.id, true).await;
        assert!(result.is_ok());

        let found = result.unwrap();
        assert!(found.is_some());

        let workspace = found.unwrap();
        assert_eq!(workspace.id, created.id);
        assert_eq!(workspace.name, created.name);
    }

    #[tokio::test]
    async fn test_get_workspace_by_id_not_found() {
        let (pool, _temp_dir) = setup_test_db().await;

        let result = get_workspace_by_id(&pool, "nonexistent-id", true).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_get_workspace_inactive_not_returned() {
        let (pool, _temp_dir) = setup_test_db().await;

        // Create a workspace and then mark it inactive
        let request = CreateWorkspaceRequest {
            name: "Inactive Workspace".to_string(),
            description: None,
        };
        let created = create_workspace(&pool, request).await.unwrap();

        // Mark as inactive directly
        sqlx::query(r#"UPDATE workspaces SET is_active = 0 WHERE id = ?"#)
            .bind(&created.id)
            .execute(&pool)
            .await
            .unwrap();

        // Should not find inactive workspace
        let result = get_workspace_by_id(&pool, &created.id, true).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }
}
