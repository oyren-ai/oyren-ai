use crate::errors::PdfServiceError;
use std::path::Path;

/// Extract filename from a file path
pub fn extract_filename(file_path: &str) -> Result<String, PdfServiceError> {
    let path = Path::new(file_path);
    path.file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| PdfServiceError::ProcessingError {
            message: "Invalid filename".to_string(),
        })
        .map(|s| s.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_filename_simple_path() {
        let result = extract_filename("/path/to/document.pdf");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "document.pdf");
    }

    #[test]
    fn test_extract_filename_just_filename() {
        let result = extract_filename("file.txt");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "file.txt");
    }

    #[test]
    fn test_extract_filename_with_spaces() {
        let result = extract_filename("/path/to/my document.pdf");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "my document.pdf");
    }

    #[test]
    fn test_extract_filename_nested_path() {
        let result = extract_filename("/a/b/c/d/e/file.txt");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "file.txt");
    }

    #[test]
    fn test_extract_filename_no_extension() {
        let result = extract_filename("/path/to/README");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "README");
    }

    #[test]
    fn test_extract_filename_empty_path_returns_error() {
        let result = extract_filename("");
        assert!(result.is_err());
        match result.unwrap_err() {
            PdfServiceError::ProcessingError { message } => {
                assert_eq!(message, "Invalid filename");
            }
            _ => panic!("Expected ProcessingError"),
        }
    }

    #[test]
    fn test_extract_filename_root_path_returns_error() {
        let result = extract_filename("/");
        assert!(result.is_err());
    }
}
