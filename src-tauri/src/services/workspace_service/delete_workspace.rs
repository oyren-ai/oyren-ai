use crate::adapters::db::{repositories, sqlite};

pub async fn delete_workspace(id: String) -> Result<(), String> {
    let pool = sqlite::get_db_pool()?;

    repositories::workspace::delete_workspace(pool, &id).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use crate::services::workspace_service::create_workspace::create_workspace;
    use crate::services::workspace_service::get_workspace::get_workspace;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_delete_workspace_success() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        // Create a workspace
        let created = create_workspace(temp_dir.path(), "To Delete".to_string(), None)
            .await
            .unwrap();

        // Delete it
        let result = delete_workspace(created.id.clone()).await;

        assert!(result.is_ok());

        // Verify it's gone (soft deleted)
        let found = get_workspace(created.id).await.unwrap();
        assert!(found.is_none());
    }

    #[tokio::test]
    async fn test_delete_workspace_idempotent() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        // Create and delete a workspace
        let created = create_workspace(temp_dir.path(), "Delete Twice".to_string(), None)
            .await
            .unwrap();
        delete_workspace(created.id.clone()).await.unwrap();

        // Delete again should succeed
        let result = delete_workspace(created.id).await;
        assert!(result.is_ok());
    }
}
