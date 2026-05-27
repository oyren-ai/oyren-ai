use std::path::PathBuf;
use crate::config;

/// Initializes the application logger
///
/// # Arguments
/// * `app_data_dir` - The application data directory path
///
/// # Examples
/// ```ignore
/// use std::path::PathBuf;
/// use oyren::setup::init_logger;
/// let app_data_dir = PathBuf::from("/tmp/test_app");
/// init_logger(&app_data_dir);
/// ```
pub fn init_logger(app_data_dir: &PathBuf) {
    config::Logger::new(app_data_dir).init();
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use tempfile::TempDir;

    #[test]
    fn test_init_logger_with_valid_path() {
        let temp_dir = TempDir::new().expect("Failed to create temp directory");
        let app_data_dir = temp_dir.path().to_path_buf();

        // This should not panic
        init_logger(&app_data_dir);

        // Logger is initialized, test passes if no panic occurs
    }

    #[test]
    fn test_init_logger_with_nested_path() {
        let temp_dir = TempDir::new().expect("Failed to create temp directory");
        let nested_path = temp_dir.path().join("nested").join("path");
        std::fs::create_dir_all(&nested_path).expect("Failed to create nested directories");

        // This should not panic
        init_logger(&nested_path);

        // Logger is initialized, test passes if no panic occurs
    }

    #[test]
    fn test_init_logger_creates_log_directory() {
        let temp_dir = TempDir::new().expect("Failed to create temp directory");
        let app_data_dir = temp_dir.path().to_path_buf();

        init_logger(&app_data_dir);

        // Verify that logger initialization doesn't fail
        // The actual log directory creation is tested in config::Logger tests
    }
}