use crate::errors::{io_error_to_file_error, FileError};
use std::fs;
use std::path::Path;

/// Delete a file from the filesystem
/// Returns Ok(()) if successful, FileError otherwise
pub fn delete_file(filepath: &str) -> Result<(), FileError> {
    // Check if file exists
    if !Path::new(filepath).exists() {
        return Err(FileError::NotFound {
            path: filepath.to_string(),
        });
    }

    // Get file metadata
    let metadata = fs::metadata(filepath).map_err(io_error_to_file_error)?;

    // Check if it's a file (not a directory)
    if !metadata.is_file() {
        return Err(FileError::NotAFile {
            path: filepath.to_string(),
        });
    }

    // Delete the file
    fs::remove_file(filepath).map_err(io_error_to_file_error)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_delete_file_success() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");

        // Create file
        fs::write(&file_path, b"test content").unwrap();
        assert!(file_path.exists());

        // Delete file
        let result = delete_file(file_path.to_str().unwrap());
        assert!(result.is_ok());

        // Verify file is deleted
        assert!(!file_path.exists());
    }

    #[test]
    fn test_delete_file_not_found() {
        let result = delete_file("/non/existent/file.txt");
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(matches!(error, FileError::NotFound { .. }));
    }

    #[test]
    fn test_delete_directory_fails() {
        let temp_dir = TempDir::new().unwrap();
        let dir_path = temp_dir.path().join("test_dir");
        fs::create_dir(&dir_path).unwrap();

        let result = delete_file(dir_path.to_str().unwrap());
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(matches!(error, FileError::NotAFile { .. }));

        // Verify directory still exists
        assert!(dir_path.exists());
    }

    #[test]
    fn test_delete_empty_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("empty.txt");

        // Create empty file
        fs::File::create(&file_path).unwrap();
        assert!(file_path.exists());

        let result = delete_file(file_path.to_str().unwrap());
        assert!(result.is_ok());
        assert!(!file_path.exists());
    }

    #[test]
    fn test_delete_large_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("large.bin");

        // Create a 5MB file
        let content: Vec<u8> = vec![0; 5 * 1024 * 1024];
        fs::write(&file_path, &content).unwrap();
        assert!(file_path.exists());

        let result = delete_file(file_path.to_str().unwrap());
        assert!(result.is_ok());
        assert!(!file_path.exists());
    }

    #[test]
    fn test_delete_file_with_special_characters() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("special-file_name.2024.txt");

        fs::write(&file_path, b"content").unwrap();
        assert!(file_path.exists());

        let result = delete_file(file_path.to_str().unwrap());
        assert!(result.is_ok());
        assert!(!file_path.exists());
    }
}
