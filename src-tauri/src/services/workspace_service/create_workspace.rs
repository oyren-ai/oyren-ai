use crate::adapters::db::{repositories, sqlite, CreateWorkspaceRequest, Workspace};
use crate::adapters::os::folder;
use crate::errors::file_error_to_string;
use std::path::Path;

pub async fn create_workspace(
    workspaces_base_dir: &Path,
    name: String,
    description: Option<String>,
) -> Result<Workspace, String> {
    let pool = sqlite::get_db_pool()?;

    // Step 1: Create workspace in database
    let workspace = repositories::workspace::create_workspace(
        pool,
        CreateWorkspaceRequest { name, description },
    )
    .await?;

    // Step 2: Create workspace folder
    match folder::create_app_folder(workspaces_base_dir, &workspace.id) {
        Ok(_) => Ok(workspace),
        Err(folder_err) => {
            // Step 3: Rollback - delete workspace from database
            let _ = repositories::workspace::delete_workspace(pool, &workspace.id).await;
            Err(format!(
                "Failed to create workspace folder: {}",
                file_error_to_string(&folder_err)
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_create_workspace_success() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        let result = create_workspace(
            temp_dir.path(),
            "Test Workspace".to_string(),
            Some("Test Description".to_string()),
        )
        .await;

        assert!(result.is_ok());

        let workspace = result.unwrap();
        assert_eq!(workspace.name, "Test Workspace");
        assert_eq!(workspace.description, Some("Test Description".to_string()));
        assert!(workspace.is_active);
        assert!(!workspace.is_pinned);

        // Verify folder was created
        let workspace_folder = temp_dir.path().join(&workspace.id);
        assert!(workspace_folder.exists());
        assert!(workspace_folder.is_dir());
    }

    #[tokio::test]
    async fn test_create_workspace_without_description() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        let result = create_workspace(temp_dir.path(), "Minimal Workspace".to_string(), None).await;

        assert!(result.is_ok());

        let workspace = result.unwrap();
        assert_eq!(workspace.name, "Minimal Workspace");
        assert!(workspace.description.is_none());

        // Verify folder was created
        let workspace_folder = temp_dir.path().join(&workspace.id);
        assert!(workspace_folder.exists());
    }

    #[tokio::test]
    async fn test_create_workspace_with_special_characters() {
        init_test_db().await;
        let temp_dir = TempDir::new().unwrap();

        let result = create_workspace(
            temp_dir.path(),
            "Test-Workspace_123!".to_string(),
            Some("Desc with émojis 🎉".to_string()),
        )
        .await;

        assert!(result.is_ok());

        let workspace = result.unwrap();
        assert_eq!(workspace.name, "Test-Workspace_123!");
        assert!(workspace
            .description
            .unwrap()
            .contains("Desc with émojis 🎉"));

        // Verify folder was created
        let workspace_folder = temp_dir.path().join(&workspace.id);
        assert!(workspace_folder.exists());
    }
}
