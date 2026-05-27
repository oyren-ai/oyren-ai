use crate::errors::{io_error_to_file_error, FileError};
use std::fs;

/// Check if path is a file
#[allow(dead_code)]
pub fn is_file(filepath: &str) -> Result<bool, FileError> {
    let metadata = fs::metadata(filepath).map_err(io_error_to_file_error)?;
    Ok(metadata.is_file())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::errors::FileError;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_is_file_returns_true() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("is_file_test.txt");

        fs::write(&file_path, b"file content").unwrap();

        let result = is_file(file_path.to_str().unwrap());
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_is_file_returns_false_for_directory() {
        let temp_dir = TempDir::new().unwrap();

        let result = is_file(temp_dir.path().to_str().unwrap());
        assert!(result.is_ok());
        assert!(!result.unwrap());
    }

    #[test]
    fn test_is_file_error_for_non_existent() {
        let result = is_file("/non/existent/path");
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(matches!(error, FileError::IoError { .. }));
    }
}
