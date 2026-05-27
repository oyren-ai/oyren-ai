use crate::adapters::db::{repositories, sqlite, Workspace};

pub async fn list_workspaces() -> Result<Vec<Workspace>, String> {
    let pool = sqlite::get_db_pool()?;

    repositories::workspace::get_all_workspaces(pool).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use crate::services::workspace_service::create_workspace::create_workspace;
    use crate::services::workspace_service::delete_workspace::delete_workspace;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_list_workspaces_returns_multiple() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        // Create some workspaces
        let _ws1 = create_workspace(temp_dir.path(), "Workspace Alpha".to_string(), None)
            .await
            .unwrap();
        let _ws2 = create_workspace(temp_dir.path(), "Workspace Beta".to_string(), None)
            .await
            .unwrap();

        let result = list_workspaces().await;

        assert!(result.is_ok());

        let workspaces = result.unwrap();
        // Should have at least the 2 we just created (may have more from other tests)
        assert!(workspaces.len() >= 2);
    }

    #[tokio::test]
    async fn test_list_workspaces_excludes_deleted() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        // Create two workspaces
        let ws1 = create_workspace(temp_dir.path(), "Active WS".to_string(), None)
            .await
            .unwrap();
        let ws2 = create_workspace(temp_dir.path(), "Deleted WS".to_string(), None)
            .await
            .unwrap();

        // Delete one
        delete_workspace(ws2.id.clone()).await.unwrap();

        // List should not include deleted
        let workspaces = list_workspaces().await.unwrap();

        // Active workspace should be in the list
        assert!(workspaces.iter().any(|w| w.id == ws1.id));

        // Deleted workspace should not be in the list
        assert!(!workspaces.iter().any(|w| w.id == ws2.id));
    }
}
