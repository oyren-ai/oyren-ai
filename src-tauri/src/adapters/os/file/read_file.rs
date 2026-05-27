use crate::errors::{io_error_to_file_error, FileError};
use std::fs;
use std::path::Path;

/// Read a file and return its contents as bytes
pub fn read_file(filepath: &str) -> Result<Vec<u8>, FileError> {
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

    // Read the file
    fs::read(filepath).map_err(io_error_to_file_error)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::errors::FileError;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_read_file_success() {
        // Create a temporary directory and file
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        let test_content = b"Hello, World!";

        // Write test content to file
        fs::write(&file_path, test_content).unwrap();

        // Test reading the file
        let result = read_file(file_path.to_str().unwrap());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), test_content);
    }

    #[test]
    fn test_read_file_not_found() {
        let result = read_file("/non/existent/file.txt");
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(matches!(error, FileError::NotFound { .. }));
    }

    #[test]
    fn test_read_directory_as_file() {
        let temp_dir = TempDir::new().unwrap();
        let dir_path = temp_dir.path();

        // Try to read a directory as a file
        let result = read_file(dir_path.to_str().unwrap());
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(matches!(error, FileError::NotAFile { .. }));
    }

    #[test]
    fn test_read_large_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("large.txt");

        // Create a 1MB file
        let large_content: Vec<u8> = (0..1024 * 1024).map(|i| (i % 256) as u8).collect();
        fs::write(&file_path, &large_content).unwrap();

        let result = read_file(file_path.to_str().unwrap());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), large_content);
    }

    #[test]
    fn test_read_empty_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("empty.txt");

        // Create an empty file
        fs::File::create(&file_path).unwrap();

        let result = read_file(file_path.to_str().unwrap());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), Vec::<u8>::new());
    }

    #[test]
    fn test_file_with_special_characters_in_name() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("special-file_name.2024.txt");
        let content = b"Special file content";

        fs::write(&file_path, content).unwrap();

        let result = read_file(file_path.to_str().unwrap());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), content);
    }
}
