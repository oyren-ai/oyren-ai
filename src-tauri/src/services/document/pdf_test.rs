use super::*;
use crate::errors::FileError;
use std::fs;
use std::path::Path;
use tempfile::TempDir;

#[test]
fn test_read_pdf_file_success() {
    // Create a temporary file
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.pdf");
    let test_data = vec![0x25, 0x50, 0x44, 0x46]; // PDF magic bytes
    fs::write(&file_path, &test_data).unwrap();

    let result = read_pdf_file(file_path.to_str().unwrap());
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), test_data);
}

#[test]
fn test_read_pdf_file_not_found() {
    let result = read_pdf_file("/nonexistent/file.pdf");
    assert!(result.is_err());

    match result.unwrap_err() {
        PdfServiceError::FileError { source } => {
            // Check that the underlying error is a NotFound error
            match source {
                FileError::NotFound { .. } => (),
                _ => panic!("Expected FileError::NotFound, got {:?}", source),
            }
        }
        _ => panic!("Expected FileError"),
    }
}

#[test]
fn test_read_pdf_file_permission_denied() {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;

        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("restricted.pdf");
        fs::write(&file_path, b"test").unwrap();

        // Remove read permissions
        let mut perms = fs::metadata(&file_path).unwrap().permissions();
        perms.set_mode(0o000);
        fs::set_permissions(&file_path, perms).unwrap();

        let result = read_pdf_file(file_path.to_str().unwrap());
        assert!(result.is_err());

        // Restore permissions for cleanup
        let mut perms = fs::metadata(&file_path).unwrap().permissions();
        perms.set_mode(0o644);
        fs::set_permissions(&file_path, perms).unwrap();
    }
}

#[test]
fn test_extract_pdf_sync_not_found() {
    let result = extract_pdf_sync("/nonexistent/file.pdf");
    assert!(result.is_err());

    match result.unwrap_err() {
        PdfServiceError::InvalidPdf { path } => {
            assert_eq!(path, "/nonexistent/file.pdf");
        }
        _ => panic!("Expected InvalidPdf error"),
    }
}

#[test]
fn test_extract_pdf_sync_invalid_pdf() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("invalid.pdf");
    fs::write(&file_path, b"not a pdf").unwrap();

    let result = extract_pdf_sync(file_path.to_str().unwrap());

    // Even invalid PDFs should return Ok with placeholder content
    assert!(result.is_ok());

    let processing_result = result.unwrap();
    assert!(processing_result.success);
    assert_eq!(processing_result.pages.len(), 1);
    assert!(processing_result.pages[0]
        .text
        .contains("Unable to extract text"));
}

#[test]
fn test_extract_pdf_sync_empty_pdf() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("empty.pdf");
    fs::write(&file_path, b"").unwrap();

    let result = extract_pdf_sync(file_path.to_str().unwrap());

    // Empty files should still return Ok with error message
    assert!(result.is_ok());

    let processing_result = result.unwrap();
    assert!(processing_result.success);
    assert_eq!(processing_result.pages.len(), 1);
    assert!(processing_result.pages[0]
        .text
        .contains("Unable to extract text"));
}

#[test]
fn test_search_pdf_text_empty_pages() {
    let pages = vec![];
    let result = search_pdf_text(pages, "test".to_string());

    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 0);
}

#[test]
fn test_search_pdf_text_empty_query() {
    let pages = vec![PdfPageContent {
        page_number: 1,
        text: "Some content here".to_string(),
        image_base64: None,
        width: 595.0,
        height: 842.0,
    }];

    let result = search_pdf_text(pages, "".to_string());

    // Empty query should match everything
    assert!(result.is_ok());
    let matches = result.unwrap();
    assert_eq!(matches.len(), 1);
    assert_eq!(matches[0].0, 1);
}

#[test]
fn test_search_pdf_text_no_matches() {
    let pages = vec![PdfPageContent {
        page_number: 1,
        text: "Some content here".to_string(),
        image_base64: None,
        width: 595.0,
        height: 842.0,
    }];

    let result = search_pdf_text(pages, "nonexistent".to_string());

    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 0);
}

#[test]
fn test_search_pdf_text_case_insensitive() {
    let pages = vec![PdfPageContent {
        page_number: 1,
        text: "Some CONTENT Here".to_string(),
        image_base64: None,
        width: 595.0,
        height: 842.0,
    }];

    let result = search_pdf_text(pages, "content".to_string());

    assert!(result.is_ok());
    let matches = result.unwrap();
    assert_eq!(matches.len(), 1);
    assert_eq!(matches[0].0, 1);
    assert!(matches[0].1[0].contains("CONTENT"));
}

#[test]
fn test_search_pdf_text_multiple_matches() {
    let pages = vec![
        PdfPageContent {
            page_number: 1,
            text: "First test line\nSecond line\nThird test line".to_string(),
            image_base64: None,
            width: 595.0,
            height: 842.0,
        },
        PdfPageContent {
            page_number: 2,
            text: "Another test on page 2".to_string(),
            image_base64: None,
            width: 595.0,
            height: 842.0,
        },
    ];

    let result = search_pdf_text(pages, "test".to_string());

    assert!(result.is_ok());
    let matches = result.unwrap();
    assert_eq!(matches.len(), 2);
    assert_eq!(matches[0].0, 1);
    assert_eq!(matches[0].1.len(), 2); // Two matches on page 1
    assert_eq!(matches[1].0, 2);
    assert_eq!(matches[1].1.len(), 1); // One match on page 2
}

#[test]
fn test_search_pdf_text_context_boundaries() {
    // Test context extraction at beginning and end of text
    let pages = vec![PdfPageContent {
        page_number: 1,
        text: "Line 1\nLine 2 match\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7 match\nLine 8"
            .to_string(),
        image_base64: None,
        width: 595.0,
        height: 842.0,
    }];

    let result = search_pdf_text(pages, "match".to_string());

    assert!(result.is_ok());
    let matches = result.unwrap();
    assert_eq!(matches.len(), 1);
    assert_eq!(matches[0].1.len(), 2);

    // First match should have context from line 1
    assert!(matches[0].1[0].contains("Line 1"));

    // Second match should have proper context
    assert!(matches[0].1[1].contains("Line 7"));
}

#[test]
fn test_clean_extracted_text_basic() {
    let input = "  Multiple   spaces   here  ";
    let result = clean_extracted_text(input);
    assert_eq!(result, "Multiple spaces here");
}

#[test]
fn test_clean_extracted_text_sentence_breaks() {
    let input = "First sentence. Second sentence";
    let result = clean_extracted_text(input);
    assert!(result.contains(".\n\n"));
}

#[test]
fn test_clean_extracted_text_section_numbers() {
    let input = "1.1 Introduction to the topic";
    let result = clean_extracted_text(input);
    assert!(result.contains("\n\n1.1"));
}

#[test]
fn test_split_text_into_pages_empty() {
    let pages = split_text_into_pages("");
    assert_eq!(pages.len(), 0);
}

#[test]
fn test_split_text_into_pages_small_text() {
    let text = "Small text that fits in one page";
    let pages = split_text_into_pages(text);

    assert_eq!(pages.len(), 1);
    assert_eq!(pages[0].page_number, 1);
    assert_eq!(pages[0].text, text);
    assert_eq!(pages[0].width, PDF_PLACEHOLDER_PAGE_WIDTH);
    assert_eq!(pages[0].height, PDF_PLACEHOLDER_PAGE_HEIGHT);
}

#[test]
fn test_split_text_into_pages_large_text() {
    // Create text larger than MAX_CHARS_PER_PAGE (50000)
    let section = "a".repeat(30000);
    let text = format!("{}\n\n{}", section, section);

    let pages = split_text_into_pages(&text);

    assert_eq!(pages.len(), 2);
    assert_eq!(pages[0].page_number, 1);
    assert_eq!(pages[1].page_number, 2);
}

#[test]
fn test_split_text_into_pages_preserves_sections() {
    let text = "Section 1\n\nSection 2\n\nSection 3";
    let pages = split_text_into_pages(text);

    assert_eq!(pages.len(), 1);
    assert!(pages[0].text.contains("Section 1"));
    assert!(pages[0].text.contains("Section 2"));
    assert!(pages[0].text.contains("Section 3"));
}
