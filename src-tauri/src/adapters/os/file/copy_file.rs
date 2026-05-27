use crate::errors::{io_error_to_file_error, FileError};
use std::fs;
use std::path::Path;

/// Copy a file from source to destination
/// Returns Ok(()) if successful, FileError otherwise
pub fn copy_file(source_path: &str, dest_path: &str) -> Result<(), FileError> {
    // Check if source file exists
    if !Path::new(source_path).exists() {
        return Err(FileError::NotFound {
            path: source_path.to_string(),
        });
    }

    // Get source metadata
    let metadata = fs::metadata(source_path).map_err(io_error_to_file_error)?;

    // Check if source is a file (not a directory)
    if !metadata.is_file() {
        return Err(FileError::NotAFile {
            path: source_path.to_string(),
        });
    }

    // Copy the file
    fs::copy(source_path, dest_path).map_err(io_error_to_file_error)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_copy_file_success() {
        // Create temporary directory and source file
        let temp_dir = TempDir::new().unwrap();
        let source = temp_dir.path().join("source.txt");
        let dest = temp_dir.path().join("dest.txt");
        let test_content = b"Hello, World!";

        // Write test content to source
        fs::write(&source, test_content).unwrap();

        // Test copying the file
        let result = copy_file(source.to_str().unwrap(), dest.to_str().unwrap());
        assert!(result.is_ok());

        // Verify destination file exists and has correct content
        assert!(dest.exists());
        let dest_content = fs::read(&dest).unwrap();
        assert_eq!(dest_content, test_content);
    }

    #[test]
    fn test_copy_file_source_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let source = "/non/existent/file.txt";
        let dest = temp_dir.path().join("dest.txt");

        let result = copy_file(source, dest.to_str().unwrap());
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(matches!(error, FileError::NotFound { .. }));
    }

    #[test]
    fn test_copy_file_dest_parent_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let source = temp_dir.path().join("source.txt");
        fs::write(&source, b"test").unwrap();

        let dest = "/non/existent/directory/dest.txt";

        let result = copy_file(source.to_str().unwrap(), dest);
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(matches!(error, FileError::IoError { .. }));
    }

    #[test]
    fn test_copy_file_preserves_content_exactly() {
        let temp_dir = TempDir::new().unwrap();
        let source = temp_dir.path().join("source.bin");
        let dest = temp_dir.path().join("dest.bin");

        // Create binary content with various byte values
        let binary_content: Vec<u8> = (0..256).map(|i| i as u8).collect();
        fs::write(&source, &binary_content).unwrap();

        let result = copy_file(source.to_str().unwrap(), dest.to_str().unwrap());
        assert!(result.is_ok());

        // Verify exact binary content match
        let dest_content = fs::read(&dest).unwrap();
        assert_eq!(dest_content, binary_content);
    }

    #[test]
    fn test_copy_large_file() {
        let temp_dir = TempDir::new().unwrap();
        let source = temp_dir.path().join("large.bin");
        let dest = temp_dir.path().join("large_copy.bin");

        // Create a 5MB file
        let large_content: Vec<u8> = (0..5 * 1024 * 1024).map(|i| (i % 256) as u8).collect();
        fs::write(&source, &large_content).unwrap();

        let result = copy_file(source.to_str().unwrap(), dest.to_str().unwrap());
        assert!(result.is_ok());

        // Verify size and content
        let dest_metadata = fs::metadata(&dest).unwrap();
        assert_eq!(dest_metadata.len(), large_content.len() as u64);
    }

    #[test]
    fn test_copy_file_overwrites_existing() {
        let temp_dir = TempDir::new().unwrap();
        let source = temp_dir.path().join("source.txt");
        let dest = temp_dir.path().join("dest.txt");

        // Create source with content
        fs::write(&source, b"New content").unwrap();
        // Create destination with different content
        fs::write(&dest, b"Old content").unwrap();

        let result = copy_file(source.to_str().unwrap(), dest.to_str().unwrap());
        assert!(result.is_ok());

        // Verify destination has new content
        let dest_content = fs::read(&dest).unwrap();
        assert_eq!(dest_content, b"New content");
    }

    #[test]
    fn test_copy_empty_file() {
        let temp_dir = TempDir::new().unwrap();
        let source = temp_dir.path().join("empty.txt");
        let dest = temp_dir.path().join("empty_copy.txt");

        // Create empty file
        fs::File::create(&source).unwrap();

        let result = copy_file(source.to_str().unwrap(), dest.to_str().unwrap());
        assert!(result.is_ok());

        // Verify destination exists and is empty
        assert!(dest.exists());
        let dest_content = fs::read(&dest).unwrap();
        assert_eq!(dest_content, Vec::<u8>::new());
    }

    #[test]
    fn test_copy_file_source_is_directory() {
        let temp_dir = TempDir::new().unwrap();
        let source_dir = temp_dir.path().join("source_dir");
        fs::create_dir(&source_dir).unwrap();
        let dest = temp_dir.path().join("dest.txt");

        let result = copy_file(source_dir.to_str().unwrap(), dest.to_str().unwrap());
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(matches!(error, FileError::NotAFile { .. }));
    }
}
