use crate::errors::{io_error_to_file_error, FileError};
use std::fs;
use std::path::Path;

/// Get file metadata
pub fn get_file_metadata(filepath: &str) -> Result<fs::Metadata, FileError> {
    if !Path::new(filepath).exists() {
        return Err(FileError::NotFound {
            path: filepath.to_string(),
        });
    }

    fs::metadata(filepath).map_err(io_error_to_file_error)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::errors::FileError;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_get_file_metadata_success() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("metadata_test.txt");
        let test_content = b"Test content for metadata";

        fs::write(&file_path, test_content).unwrap();

        let result = get_file_metadata(file_path.to_str().unwrap());
        assert!(result.is_ok());

        let metadata = result.unwrap();
        assert!(metadata.is_file());
        assert_eq!(metadata.len(), test_content.len() as u64);
    }

    #[test]
    fn test_get_file_metadata_not_found() {
        let result = get_file_metadata("/non/existent/file.txt");
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(matches!(error, FileError::NotFound { .. }));
    }
}
