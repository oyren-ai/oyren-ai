use crate::errors::{io_error_to_file_error, FileError};
use std::fs;
use std::path::Path;

/// Verify a folder exists, creating it if necessary
pub fn verify_folder_exists(workspace_dir: &Path) -> Result<(), FileError> {
    if !workspace_dir.exists() {
        fs::create_dir_all(workspace_dir).map_err(io_error_to_file_error)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_verify_folder_exists_creates_new_folder() {
        let temp_dir = TempDir::new().unwrap();
        let workspace_dir = temp_dir.path().join("new_folder");

        assert!(!workspace_dir.exists());

        let result = verify_folder_exists(&workspace_dir);

        assert!(result.is_ok());
        assert!(workspace_dir.exists());
        assert!(workspace_dir.is_dir());
    }

    #[test]
    fn test_verify_folder_exists_succeeds_for_existing_folder() {
        let temp_dir = TempDir::new().unwrap();
        let workspace_dir = temp_dir.path().join("existing");

        fs::create_dir(&workspace_dir).unwrap();
        assert!(workspace_dir.exists());

        let result = verify_folder_exists(&workspace_dir);

        assert!(result.is_ok());
        assert!(workspace_dir.exists());
    }

    #[test]
    fn test_verify_folder_exists_creates_nested_folders() {
        let temp_dir = TempDir::new().unwrap();
        let workspace_dir = temp_dir.path().join("a/b/c/d");

        assert!(!workspace_dir.exists());

        let result = verify_folder_exists(&workspace_dir);

        assert!(result.is_ok());
        assert!(workspace_dir.exists());
        assert!(workspace_dir.is_dir());
    }

    #[test]
    fn test_verify_folder_exists_with_workspace_id_path() {
        let temp_dir = TempDir::new().unwrap();
        let workspace_id = "550e8400-e29b-41d4-a716-446655440000";
        let workspace_dir = temp_dir.path().join(workspace_id);

        let result = verify_folder_exists(&workspace_dir);

        assert!(result.is_ok());
        assert!(workspace_dir.exists());
    }

    #[test]
    fn test_verify_folder_exists_idempotent() {
        let temp_dir = TempDir::new().unwrap();
        let workspace_dir = temp_dir.path().join("idempotent");

        let result1 = verify_folder_exists(&workspace_dir);
        assert!(result1.is_ok());

        let result2 = verify_folder_exists(&workspace_dir);
        assert!(result2.is_ok());

        assert!(workspace_dir.exists());
    }
}
