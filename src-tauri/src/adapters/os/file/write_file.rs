use crate::errors::{io_error_to_file_error, FileError};
use std::fs;
use std::path::Path;

/// Write content to a file, creating it if it doesn't exist
pub fn write_file(path: &Path, content: &str) -> Result<(), FileError> {
    fs::write(path, content).map_err(io_error_to_file_error)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_write_file_creates_new_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");

        let result = write_file(&file_path, "hello world");

        assert!(result.is_ok());
        assert!(file_path.exists());
        assert_eq!(fs::read_to_string(&file_path).unwrap(), "hello world");
    }

    #[test]
    fn test_write_file_overwrites_existing() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("existing.txt");

        fs::write(&file_path, "old content").unwrap();

        let result = write_file(&file_path, "new content");

        assert!(result.is_ok());
        assert_eq!(fs::read_to_string(&file_path).unwrap(), "new content");
    }

    #[test]
    fn test_write_file_empty_content() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("empty.txt");

        let result = write_file(&file_path, "");

        assert!(result.is_ok());
        assert!(file_path.exists());
        assert_eq!(fs::read_to_string(&file_path).unwrap(), "");
    }

    #[test]
    fn test_write_file_multiline_content() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("multiline.md");
        let content = "# Title\n\nParagraph 1\n\nParagraph 2";

        let result = write_file(&file_path, content);

        assert!(result.is_ok());
        assert_eq!(fs::read_to_string(&file_path).unwrap(), content);
    }
}
