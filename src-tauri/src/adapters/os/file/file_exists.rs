use std::path::Path;

/// Check if a file exists
pub fn file_exists(filepath: &str) -> bool {
    Path::new(filepath).exists()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_file_exists_returns_true() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("exists.txt");

        fs::write(&file_path, b"exists").unwrap();

        assert!(file_exists(file_path.to_str().unwrap()));
    }

    #[test]
    fn test_file_exists_returns_false() {
        assert!(!file_exists("/non/existent/file.txt"));
    }
}
