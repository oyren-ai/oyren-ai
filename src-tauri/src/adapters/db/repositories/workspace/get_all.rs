use crate::adapters::db::models::Workspace;
use sqlx::SqlitePool;

pub async fn get_all_workspaces(pool: &SqlitePool) -> Result<Vec<Workspace>, String> {
    sqlx::query_as::<_, Workspace>(
        "SELECT * FROM workspaces WHERE is_active = 1 ORDER BY last_accessed_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to get workspaces: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::CreateWorkspaceRequest;
    use crate::adapters::db::repositories::workspace::create_workspace;
    use chrono::Utc;
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
    async fn test_get_all_workspaces_empty() {
        let (pool, _temp_dir) = setup_test_db().await;

        let result = get_all_workspaces(&pool).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }

    #[tokio::test]
    async fn test_get_all_workspaces_multiple() {
        let (pool, _temp_dir) = setup_test_db().await;

        // Create multiple workspaces
        for i in 1..=3 {
            let request = CreateWorkspaceRequest {
                name: format!("Workspace {}", i),
                description: None,
            };
            create_workspace(&pool, request).await.unwrap();
        }

        let result = get_all_workspaces(&pool).await;
        assert!(result.is_ok());

        let workspaces = result.unwrap();
        assert_eq!(workspaces.len(), 3);
    }

    #[tokio::test]
    async fn test_get_all_workspaces_excludes_inactive() {
        let (pool, _temp_dir) = setup_test_db().await;

        // Create active workspaces
        for i in 1..=2 {
            let request = CreateWorkspaceRequest {
                name: format!("Active Workspace {}", i),
                description: None,
            };
            create_workspace(&pool, request).await.unwrap();
        }

        // Create and mark one as inactive
        let request = CreateWorkspaceRequest {
            name: "Inactive Workspace".to_string(),
            description: None,
        };
        let inactive = create_workspace(&pool, request).await.unwrap();

        sqlx::query("UPDATE workspaces SET is_active = 0 WHERE id = ?")
            .bind(&inactive.id)
            .execute(&pool)
            .await
            .unwrap();

        let result = get_all_workspaces(&pool).await;
        assert!(result.is_ok());

        let workspaces = result.unwrap();
        assert_eq!(workspaces.len(), 2);
        assert!(workspaces.iter().all(|w| w.name.starts_with("Active")));
    }

    #[tokio::test]
    async fn test_get_all_workspaces_ordered_by_last_accessed() {
        let (pool, _temp_dir) = setup_test_db().await;

        // Create workspaces with different last_accessed times
        let mut workspace_ids = Vec::new();
        for i in 1..=3 {
            let request = CreateWorkspaceRequest {
                name: format!("Workspace {}", i),
                description: None,
            };
            let ws = create_workspace(&pool, request).await.unwrap();
            workspace_ids.push(ws.id.clone());

            // Add delay to ensure different timestamps
            tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        }

        // Update middle workspace to have most recent access time
        let now = Utc::now();
        sqlx::query("UPDATE workspaces SET last_accessed_at = ? WHERE id = ?")
            .bind(now)
            .bind(&workspace_ids[1])
            .execute(&pool)
            .await
            .unwrap();

        let result = get_all_workspaces(&pool).await;
        assert!(result.is_ok());

        let workspaces = result.unwrap();
        assert_eq!(workspaces[0].name, "Workspace 2"); // Most recently accessed
    }
}
