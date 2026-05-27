use crate::errors::FileError;
use std::path::Path;

/// Verify that a file exists and return appropriate error if not
pub fn verify_file_exists(filepath: &str) -> Result<(), FileError> {
    let path = Path::new(filepath);

    if !path.exists() {
        return Err(FileError::NotFound {
            path: filepath.to_string(),
        });
    }

    if !path.is_file() {
        return Err(FileError::NotAFile {
            path: filepath.to_string(),
        });
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_verify_file_exists_returns_ok_for_existing_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        fs::write(&file_path, b"test content").unwrap();

        let result = verify_file_exists(file_path.to_str().unwrap());

        assert!(result.is_ok());
    }

    #[test]
    fn test_verify_file_exists_returns_not_found_error_for_missing_file() {
        let result = verify_file_exists("/non/existent/file.txt");

        assert!(result.is_err());
        match result.unwrap_err() {
            FileError::NotFound { path } => {
                assert_eq!(path, "/non/existent/file.txt");
            }
            _ => panic!("Expected FileError::NotFound"),
        }
    }

    #[test]
    fn test_verify_file_exists_returns_not_found_for_empty_path() {
        let result = verify_file_exists("");

        assert!(result.is_err());
        match result.unwrap_err() {
            FileError::NotFound { path } => {
                assert_eq!(path, "");
            }
            _ => panic!("Expected FileError::NotFound"),
        }
    }

    #[test]
    fn test_verify_file_exists_returns_not_a_file_for_directory() {
        let temp_dir = TempDir::new().unwrap();
        let dir_path = temp_dir.path().to_str().unwrap();

        let result = verify_file_exists(dir_path);

        assert!(result.is_err());
        match result.unwrap_err() {
            FileError::NotAFile { path } => {
                assert_eq!(path, dir_path);
            }
            _ => panic!("Expected FileError::NotAFile"),
        }
    }

    #[test]
    fn test_verify_file_exists_handles_symlink_to_existing_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("original.txt");
        #[cfg_attr(not(unix), allow(unused_variables))]
        let symlink_path = temp_dir.path().join("symlink.txt");

        fs::write(&file_path, b"test content").unwrap();

        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(&file_path, &symlink_path).unwrap();
            let result = verify_file_exists(symlink_path.to_str().unwrap());
            assert!(result.is_ok());
        }
    }
}
