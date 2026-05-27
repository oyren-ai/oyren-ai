use crate::adapters::db::models::{CreateWorkspaceRequest, Workspace};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn create_workspace(
    pool: &SqlitePool,
    request: CreateWorkspaceRequest,
) -> Result<Workspace, String> {
    let now = Utc::now();
    let id = Uuid::new_v4().to_string();

    let workspace = Workspace {
        id: id.clone(),
        name: request.name.clone(),
        description: request.description.clone(),
        created_at: now,
        updated_at: now,
        last_accessed_at: now,
        is_pinned: false,
        is_archived: false,
        is_favourite: false,
        settings: None,
        is_active: true,
    };

    sqlx::query(
        r#"
        INSERT INTO workspaces (
            id, name, description, created_at, updated_at,
            last_accessed_at, is_pinned, is_archived,
            is_favourite, settings, is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&workspace.id)
    .bind(&workspace.name)
    .bind(&workspace.description)
    .bind(&workspace.created_at)
    .bind(&workspace.updated_at)
    .bind(&workspace.last_accessed_at)
    .bind(workspace.is_pinned)
    .bind(workspace.is_archived)
    .bind(workspace.is_favourite)
    .bind(&workspace.settings)
    .bind(workspace.is_active)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create workspace: {}", e))?;

    Ok(workspace)
}

#[cfg(test)]
mod tests {
    use super::*;
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
    async fn test_create_workspace_success() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request = CreateWorkspaceRequest {
            name: "Test Workspace".to_string(),
            description: Some("Test Description".to_string()),
        };

        let result = create_workspace(&pool, request).await;
        assert!(result.is_ok());

        let workspace = result.unwrap();
        assert_eq!(workspace.name, "Test Workspace");
        assert_eq!(workspace.description, Some("Test Description".to_string()));
        assert!(workspace.is_active);
        assert!(!workspace.is_pinned);
        assert!(!workspace.is_archived);
        assert!(!workspace.is_favourite);
        assert!(workspace.settings.is_none());
    }

    #[tokio::test]
    async fn test_create_workspace_without_description() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request = CreateWorkspaceRequest {
            name: "Minimal Workspace".to_string(),
            description: None,
        };

        let result = create_workspace(&pool, request).await;
        assert!(result.is_ok());

        let workspace = result.unwrap();
        assert_eq!(workspace.name, "Minimal Workspace");
        assert!(workspace.description.is_none());
    }

    #[tokio::test]
    async fn test_workspace_timestamps() {
        let (pool, _temp_dir) = setup_test_db().await;

        let before = Utc::now();

        let request = CreateWorkspaceRequest {
            name: "Timestamp Test".to_string(),
            description: None,
        };
        let workspace = create_workspace(&pool, request).await.unwrap();

        let after = Utc::now();

        // Verify timestamps are set correctly
        assert!(workspace.created_at >= before && workspace.created_at <= after);
        assert!(workspace.updated_at >= before && workspace.updated_at <= after);
        assert!(workspace.last_accessed_at >= before && workspace.last_accessed_at <= after);
        assert_eq!(workspace.created_at, workspace.updated_at);
    }
}
