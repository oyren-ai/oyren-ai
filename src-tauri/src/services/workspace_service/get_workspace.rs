use crate::adapters::db::{repositories, sqlite, Workspace};

pub async fn get_workspace(id: String) -> Result<Option<Workspace>, String> {
    let pool = sqlite::get_db_pool()?;
    //TODO: use some constant instead of this
    repositories::workspace::get_workspace_by_id(pool, &id, true).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use crate::services::workspace_service::create_workspace::create_workspace;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_get_workspace_by_id_success() {
        init_test_db().await;

        // Create a workspace first
        let temp_dir = TempDir::new().unwrap();
        let created = create_workspace(temp_dir.path(), "Find Me".to_string(), None)
            .await
            .unwrap();

        // Now get it by ID
        let result = get_workspace(created.id.clone()).await;

        assert!(result.is_ok());

        let found = result.unwrap();
        assert!(found.is_some());

        let workspace = found.unwrap();
        assert_eq!(workspace.id, created.id);
        assert_eq!(workspace.name, "Find Me");
    }

    #[tokio::test]
    async fn test_get_workspace_by_id_t() {
        init_test_db().await;

        let result = get_workspace("nonexistent-id-xyz".to_string()).await;

        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }
}
