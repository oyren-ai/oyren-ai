use crate::adapters::db::models::{UpdateWorkspaceRequest, Workspace};
use chrono::Utc;
use sqlx::SqlitePool;

use super::get_workspace_by_id;

pub async fn update_workspace(
    pool: &SqlitePool,
    id: &str,
    request: UpdateWorkspaceRequest,
) -> Result<Workspace, String> {
    // Validate title if provided
    if let Some(ref name) = request.name {
        if name.trim().is_empty() {
            return Err("Title cannot be empty".to_string());
        }
        if name.len() > 32 {
            return Err("Title must be 32 characters or less".to_string());
        }
    }

    // Get existing workspace
    let mut workspace = get_workspace_by_id(pool, id, true)
        .await?
        .ok_or_else(|| "Workspace not found".to_string())?;

    // Update fields
    if let Some(name) = request.name {
        workspace.name = name;
    }
    if request.description.is_some() {
        workspace.description = request.description;
    }
    workspace.updated_at = Utc::now();

    // Update in database
    sqlx::query(
        r#"
        UPDATE workspaces
        SET name = ?, description = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&workspace.name)
    .bind(&workspace.description)
    .bind(&workspace.updated_at)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update workspace: {}", e))?;

    Ok(workspace)
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
    async fn test_update_workspace_name_success() {
        let (pool, _temp_dir) = setup_test_db().await;

        // Create a workspace
        let request = CreateWorkspaceRequest {
            name: "Original Name".to_string(),
            description: None,
        };
        let created = create_workspace(&pool, request).await.unwrap();

        // Update the name
        let update_request = UpdateWorkspaceRequest {
            name: Some("Updated Name".to_string()),
            description: None,
        };

        let result = update_workspace(&pool, &created.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.id, created.id);
    }

    #[tokio::test]
    async fn test_update_workspace_description_success() {
        let (pool, _temp_dir) = setup_test_db().await;

        // Create a workspace without description
        let request = CreateWorkspaceRequest {
            name: "Test Workspace".to_string(),
            description: None,
        };
        let created = create_workspace(&pool, request).await.unwrap();

        // Update the description
        let update_request = UpdateWorkspaceRequest {
            name: None,
            description: Some("New Description".to_string()),
        };

        let result = update_workspace(&pool, &created.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.description, Some("New Description".to_string()));
    }

    #[tokio::test]
    async fn test_update_workspace_both_fields() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request = CreateWorkspaceRequest {
            name: "Original".to_string(),
            description: Some("Original Desc".to_string()),
        };
        let created = create_workspace(&pool, request).await.unwrap();

        let update_request = UpdateWorkspaceRequest {
            name: Some("Updated Name".to_string()),
            description: Some("Updated Description".to_string()),
        };

        let result = update_workspace(&pool, &created.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.description, Some("Updated Description".to_string()));
    }

    #[tokio::test]
    async fn test_update_workspace_not_found() {
        let (pool, _temp_dir) = setup_test_db().await;

        let update_request = UpdateWorkspaceRequest {
            name: Some("New Name".to_string()),
            description: None,
        };

        let result = update_workspace(&pool, "nonexistent-id", update_request).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Workspace not found");
    }

    #[tokio::test]
    async fn test_update_workspace_empty_name() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request = CreateWorkspaceRequest {
            name: "Original".to_string(),
            description: None,
        };
        let created = create_workspace(&pool, request).await.unwrap();

        let update_request = UpdateWorkspaceRequest {
            name: Some("   ".to_string()),
            description: None,
        };

        let result = update_workspace(&pool, &created.id, update_request).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Title cannot be empty");
    }

    #[tokio::test]
    async fn test_update_workspace_name_too_long() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request = CreateWorkspaceRequest {
            name: "Original".to_string(),
            description: None,
        };
        let created = create_workspace(&pool, request).await.unwrap();

        let update_request = UpdateWorkspaceRequest {
            name: Some("a".repeat(33)),
            description: None,
        };

        let result = update_workspace(&pool, &created.id, update_request).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Title must be 32 characters or less");
    }

    #[tokio::test]
    async fn test_update_workspace_name_max_length() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request = CreateWorkspaceRequest {
            name: "Original".to_string(),
            description: None,
        };
        let created = create_workspace(&pool, request).await.unwrap();

        let update_request = UpdateWorkspaceRequest {
            name: Some("a".repeat(32)),
            description: None,
        };

        let result = update_workspace(&pool, &created.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name.len(), 32);
    }

    #[tokio::test]
    async fn test_update_workspace_updated_at_changes() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request = CreateWorkspaceRequest {
            name: "Test".to_string(),
            description: None,
        };
        let created = create_workspace(&pool, request).await.unwrap();
        let original_updated_at = created.updated_at;

        // Sleep to ensure timestamp difference
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        let update_request = UpdateWorkspaceRequest {
            name: Some("Updated".to_string()),
            description: None,
        };

        let result = update_workspace(&pool, &created.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert!(updated.updated_at > original_updated_at);
    }

    #[tokio::test]
    async fn test_update_workspace_partial_update() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request = CreateWorkspaceRequest {
            name: "Original Name".to_string(),
            description: Some("Original Description".to_string()),
        };
        let created = create_workspace(&pool, request).await.unwrap();

        // Update only the name, description should remain
        let update_request = UpdateWorkspaceRequest {
            name: Some("New Name".to_string()),
            description: None,
        };

        let result = update_workspace(&pool, &created.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "New Name");
        assert_eq!(
            updated.description,
            Some("Original Description".to_string())
        );
    }

    #[tokio::test]
    async fn test_update_workspace_clear_description() {
        let (pool, _temp_dir) = setup_test_db().await;

        let request = CreateWorkspaceRequest {
            name: "Test".to_string(),
            description: Some("Original Description".to_string()),
        };
        let created = create_workspace(&pool, request).await.unwrap();

        // Clear the description by setting it to Some(None) - note: this is actually Some("")
        let update_request = UpdateWorkspaceRequest {
            name: None,
            description: Some("".to_string()),
        };

        let result = update_workspace(&pool, &created.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.description, Some("".to_string()));
    }
}
