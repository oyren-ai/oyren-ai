use std::path::Path;

pub fn handle_filename_collision(workspace_dir: &Path, original_filename: &str) -> String {
    let mut final_filename = original_filename.to_string();
    let mut counter = 1;
    let base_name = Path::new(original_filename)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("file");
    let extension = Path::new(original_filename)
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("pdf");

    loop {
        let dest_path = workspace_dir.join(&final_filename);
        if !dest_path.exists() {
            break;
        }
        final_filename = format!("{}_{}.{}", base_name, counter, extension);
        counter += 1;
    }

    final_filename
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_no_collision() {
        let temp_dir = TempDir::new().unwrap();
        let result = handle_filename_collision(temp_dir.path(), "test.pdf");
        assert_eq!(result, "test.pdf");
    }

    #[test]
    fn test_single_collision() {
        let temp_dir = TempDir::new().unwrap();
        fs::write(temp_dir.path().join("test.pdf"), b"content").unwrap();

        let result = handle_filename_collision(temp_dir.path(), "test.pdf");
        assert_eq!(result, "test_1.pdf");
    }

    #[test]
    fn test_multiple_collisions() {
        let temp_dir = TempDir::new().unwrap();
        fs::write(temp_dir.path().join("test.pdf"), b"content").unwrap();
        fs::write(temp_dir.path().join("test_1.pdf"), b"content").unwrap();
        fs::write(temp_dir.path().join("test_2.pdf"), b"content").unwrap();

        let result = handle_filename_collision(temp_dir.path(), "test.pdf");
        assert_eq!(result, "test_3.pdf");
    }

    #[test]
    fn test_no_extension() {
        let temp_dir = TempDir::new().unwrap();
        fs::write(temp_dir.path().join("readme"), b"content").unwrap();

        let result = handle_filename_collision(temp_dir.path(), "readme");
        assert_eq!(result, "readme_1.pdf");
    }
}
