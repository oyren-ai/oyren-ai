use crate::errors::FileError;
use std::path::Path;

/// Renames a file from old_path to new_path
pub fn rename_file(old_path: &str, new_path: &str) -> Result<(), FileError> {
    let old = Path::new(old_path);
    let new = Path::new(new_path);

    if !old.exists() {
        return Err(FileError::NotFound {
            path: old_path.to_string(),
        });
    }

    if new.exists() {
        return Err(FileError::IoError {
            message: format!("File already exists: {}", new_path),
        });
    }

    std::fs::rename(old, new).map_err(|e| FileError::IoError {
        message: format!(
            "Failed to rename file from {} to {}: {}",
            old_path, new_path, e
        ),
    })?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_rename_file_success() {
        let temp_dir = TempDir::new().unwrap();
        let old_path = temp_dir.path().join("old.txt");
        let new_path = temp_dir.path().join("new.txt");

        fs::write(&old_path, b"content").unwrap();

        let result = rename_file(old_path.to_str().unwrap(), new_path.to_str().unwrap());

        assert!(result.is_ok());
        assert!(!old_path.exists());
        assert!(new_path.exists());
        assert_eq!(fs::read_to_string(&new_path).unwrap(), "content");
    }

    #[test]
    fn test_rename_file_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let old_path = temp_dir.path().join("nonexistent.txt");
        let new_path = temp_dir.path().join("new.txt");

        let result = rename_file(old_path.to_str().unwrap(), new_path.to_str().unwrap());

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), FileError::NotFound { .. }));
    }

    #[test]
    fn test_rename_file_already_exists() {
        let temp_dir = TempDir::new().unwrap();
        let old_path = temp_dir.path().join("old.txt");
        let new_path = temp_dir.path().join("new.txt");

        fs::write(&old_path, b"old content").unwrap();
        fs::write(&new_path, b"new content").unwrap();

        let result = rename_file(old_path.to_str().unwrap(), new_path.to_str().unwrap());

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), FileError::IoError { .. }));
    }
}
