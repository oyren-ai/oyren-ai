use crate::adapters::db::{repositories, sqlite, UpdateWorkspaceRequest, Workspace};

pub async fn update_workspace(
    id: String,
    name: Option<String>,
    description: Option<String>,
) -> Result<Workspace, String> {
    let pool = sqlite::get_db_pool()?;

    repositories::workspace::update_workspace(
        pool,
        &id,
        UpdateWorkspaceRequest { name, description },
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use crate::services::workspace_service::create_workspace::create_workspace;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_update_workspace_name() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        // Create a workspace
        let created = create_workspace(
            temp_dir.path(),
            "Original Name".to_string(),
            Some("Desc".to_string()),
        )
        .await
        .unwrap();

        // Update the name
        let result =
            update_workspace(created.id.clone(), Some("Updated Name".to_string()), None).await;

        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.description, Some("Desc".to_string()));
    }

    #[tokio::test]
    async fn test_update_workspace_description() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        // Create a workspace
        let created = create_workspace(
            temp_dir.path(),
            "Test".to_string(),
            Some("Original Desc".to_string()),
        )
        .await
        .unwrap();

        // Update the description
        let result = update_workspace(created.id.clone(), None, Some("New Desc".to_string())).await;

        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "Test");
        assert_eq!(updated.description, Some("New Desc".to_string()));
    }

    #[tokio::test]
    async fn test_update_workspace_both_fields() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        // Create a workspace
        let created = create_workspace(
            temp_dir.path(),
            "Old Name".to_string(),
            Some("Old Desc".to_string()),
        )
        .await
        .unwrap();

        // Update both fields
        let result = update_workspace(
            created.id.clone(),
            Some("New Name".to_string()),
            Some("New Desc".to_string()),
        )
        .await;

        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "New Name");
        assert_eq!(updated.description, Some("New Desc".to_string()));
    }

    #[tokio::test]
    async fn test_update_workspace_nonexistent() {
        init_test_db().await;

        let result = update_workspace(
            "nonexistent-id".to_string(),
            Some("New Name".to_string()),
            None,
        )
        .await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[tokio::test]
    async fn test_update_workspace_empty_name_rejected() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        // Create a workspace
        let created = create_workspace(temp_dir.path(), "Valid Name".to_string(), None)
            .await
            .unwrap();

        // Try to update with empty name
        let result = update_workspace(created.id.clone(), Some("".to_string()), None).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty"));
    }

    #[tokio::test]
    async fn test_update_workspace_name_too_long() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        // Create a workspace
        let created = create_workspace(temp_dir.path(), "Valid".to_string(), None)
            .await
            .unwrap();

        // Try to update with name over 32 characters
        let long_name = "a".repeat(33);
        let result = update_workspace(created.id.clone(), Some(long_name), None).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("32 characters"));
    }
}
