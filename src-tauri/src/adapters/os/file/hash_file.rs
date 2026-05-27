use crate::errors::{io_error_to_file_error, FileError};
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::Read;
use std::path::Path;

/// Calculate SHA-256 hash of a file
/// Returns hash as hex string, or FileError on failure
pub fn hash_file(filepath: &str) -> Result<String, FileError> {
    // Check if file exists
    if !Path::new(filepath).exists() {
        return Err(FileError::NotFound {
            path: filepath.to_string(),
        });
    }

    // Get file metadata
    let metadata = std::fs::metadata(filepath).map_err(io_error_to_file_error)?;

    // Check if it's a file (not a directory)
    if !metadata.is_file() {
        return Err(FileError::NotAFile {
            path: filepath.to_string(),
        });
    }

    // Open and read the file
    let mut file = File::open(filepath).map_err(io_error_to_file_error)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0; 8192]; // 8KB buffer for efficient reading

    loop {
        let bytes_read = file.read(&mut buffer).map_err(io_error_to_file_error)?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    // Get hash result and convert to hex string
    let hash_result = hasher.finalize();
    let hash_string = format!("{:x}", hash_result);

    Ok(hash_string)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_hash_file_success() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        let content = b"Hello, World!";

        fs::write(&file_path, content).unwrap();

        let result = hash_file(file_path.to_str().unwrap());
        assert!(result.is_ok());

        let hash = result.unwrap();
        // Verify it's a valid hex string of correct length (64 chars for SHA-256)
        assert_eq!(hash.len(), 64);
        assert!(hash.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_same_content_produces_same_hash() {
        let temp_dir = TempDir::new().unwrap();
        let file1 = temp_dir.path().join("file1.txt");
        let file2 = temp_dir.path().join("file2.txt");
        let content = b"Identical content";

        fs::write(&file1, content).unwrap();
        fs::write(&file2, content).unwrap();

        let hash1 = hash_file(file1.to_str().unwrap()).unwrap();
        let hash2 = hash_file(file2.to_str().unwrap()).unwrap();

        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_different_content_produces_different_hash() {
        let temp_dir = TempDir::new().unwrap();
        let file1 = temp_dir.path().join("file1.txt");
        let file2 = temp_dir.path().join("file2.txt");

        fs::write(&file1, b"Content A").unwrap();
        fs::write(&file2, b"Content B").unwrap();

        let hash1 = hash_file(file1.to_str().unwrap()).unwrap();
        let hash2 = hash_file(file2.to_str().unwrap()).unwrap();

        assert_ne!(hash1, hash2);
    }

    #[test]
    fn test_hash_file_not_found() {
        let result = hash_file("/non/existent/file.txt");
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(matches!(error, FileError::NotFound { .. }));
    }

    #[test]
    fn test_hash_empty_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("empty.txt");

        fs::File::create(&file_path).unwrap();

        let result = hash_file(file_path.to_str().unwrap());
        assert!(result.is_ok());

        let hash = result.unwrap();
        // SHA-256 hash of empty file is known
        assert_eq!(
            hash,
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
    }

    #[test]
    fn test_hash_large_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("large.bin");

        // Create a 2MB file
        let content: Vec<u8> = (0..2 * 1024 * 1024).map(|i| (i % 256) as u8).collect();
        fs::write(&file_path, &content).unwrap();

        let result = hash_file(file_path.to_str().unwrap());
        assert!(result.is_ok());

        let hash = result.unwrap();
        assert_eq!(hash.len(), 64);
    }

    #[test]
    fn test_hash_binary_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("binary.bin");

        // Create binary content with all byte values
        let content: Vec<u8> = (0..256).map(|i| i as u8).collect();
        fs::write(&file_path, &content).unwrap();

        let result = hash_file(file_path.to_str().unwrap());
        assert!(result.is_ok());

        let hash = result.unwrap();
        assert_eq!(hash.len(), 64);
        assert!(hash.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_hash_directory_fails() {
        let temp_dir = TempDir::new().unwrap();
        let dir_path = temp_dir.path();

        let result = hash_file(dir_path.to_str().unwrap());
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(matches!(error, FileError::NotAFile { .. }));
    }
}
