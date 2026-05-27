use crate::errors::{io_error_to_file_error, FileError};
use std::fs;
use std::path::{Path, PathBuf};

pub fn create_app_folder(base_dir: &Path, folder_name: &str) -> Result<PathBuf, FileError> {
    let folder_path = base_dir.join(folder_name);

    fs::create_dir_all(&folder_path).map_err(io_error_to_file_error)?;

    Ok(folder_path)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_create_app_folder_success() {
        let temp_dir = TempDir::new().unwrap();
        let folder_name = "test-workspace";

        let result = create_app_folder(temp_dir.path(), folder_name);

        assert!(result.is_ok());
        let created_path = result.unwrap();

        // Verify the folder was created
        assert!(created_path.exists());
        assert!(created_path.is_dir());

        // Verify the path is correct
        assert_eq!(created_path, temp_dir.path().join(folder_name));
    }

    #[test]
    fn test_create_app_folder_already_exists() {
        let temp_dir = TempDir::new().unwrap();
        let folder_name = "existing-folder";

        // Create the folder first
        let first_result = create_app_folder(temp_dir.path(), folder_name);
        assert!(first_result.is_ok());

        // Try to create it again - should succeed (idempotent)
        let second_result = create_app_folder(temp_dir.path(), folder_name);
        assert!(second_result.is_ok());

        let path = second_result.unwrap();
        assert!(path.exists());
        assert!(path.is_dir());
    }

    #[test]
    fn test_create_app_folder_nested_path() {
        let temp_dir = TempDir::new().unwrap();
        let folder_name = "nested/sub/folders";

        let result = create_app_folder(temp_dir.path(), folder_name);

        assert!(result.is_ok());
        let created_path = result.unwrap();

        // Verify all nested directories were created
        assert!(created_path.exists());
        assert!(created_path.is_dir());

        // Verify parent directories exist
        assert!(created_path.parent().unwrap().exists());
        assert!(created_path.parent().unwrap().parent().unwrap().exists());
    }

    #[test]
    fn test_create_app_folder_with_special_chars() {
        let temp_dir = TempDir::new().unwrap();

        // Test with UUID-like format (common for workspace IDs)
        let folder_name = "workspace-123e4567-e89b-12d3-a456-426614174000";

        let result = create_app_folder(temp_dir.path(), folder_name);

        assert!(result.is_ok());
        let created_path = result.unwrap();

        assert!(created_path.exists());
        assert!(created_path.is_dir());
        assert!(created_path
            .to_string_lossy()
            .contains("workspace-123e4567"));
    }

    #[test]
    fn test_create_app_folder_returns_correct_path() {
        let temp_dir = TempDir::new().unwrap();
        let folder_name = "path-test";

        let result = create_app_folder(temp_dir.path(), folder_name);

        assert!(result.is_ok());
        let returned_path = result.unwrap();

        // Verify the returned path matches what we expect
        let expected_path = temp_dir.path().join(folder_name);
        assert_eq!(returned_path, expected_path);

        // Verify we can use the returned path
        let test_file = returned_path.join("test.txt");
        fs::write(&test_file, b"test content").unwrap();
        assert!(test_file.exists());
    }

    #[test]
    fn test_create_app_folder_empty_folder_name() {
        let temp_dir = TempDir::new().unwrap();
        let folder_name = "";

        // Empty folder name should create base_dir itself (idempotent)
        let result = create_app_folder(temp_dir.path(), folder_name);

        assert!(result.is_ok());
        let created_path = result.unwrap();

        // The path should be the base directory itself
        assert_eq!(created_path, temp_dir.path());
        assert!(created_path.exists());
    }
}
