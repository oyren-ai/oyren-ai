use super::*;

#[test]
fn test_read_pdf_file_command() {
    let filepath = "/non/existent/file.pdf".to_string();

    // Test that the command properly handles file path and errors
    let result = read_pdf_file(filepath);

    assert!(result.is_err());
    let error_msg = result.unwrap_err();
    assert!(error_msg.contains("not found"));
}

#[test]
fn test_extract_pdf_sync_command() {
    let filepath = "/non/existent/file.pdf".to_string();

    // Test that the command properly handles file path and errors
    let result = extract_pdf_sync(filepath);

    assert!(result.is_err());
    let error_msg = result.unwrap_err();
    assert!(error_msg.contains("Invalid PDF"));
}

#[test]
fn test_search_pdf_text_command() {
    let pages = vec![
        PdfPageContent {
            page_number: 1,
            text: "Hello world".to_string(),
            image_base64: None,
            width: 100.0,
            height: 100.0,
        },
        PdfPageContent {
            page_number: 2,
            text: "Test content".to_string(),
            image_base64: None,
            width: 100.0,
            height: 100.0,
        },
    ];

    let query = "world".to_string();

    // Test that search_pdf_text properly handles the pages and query
    let result = search_pdf_text(pages, query);

    assert!(result.is_ok());
    let search_results = result.unwrap();
    assert_eq!(search_results.len(), 1);
    assert_eq!(search_results[0].0, 1); // Page 1 contains "world"
}

#[test]
fn test_search_pdf_text_no_matches() {
    let pages = vec![PdfPageContent {
        page_number: 1,
        text: "Hello world".to_string(),
        image_base64: None,
        width: 100.0,
        height: 100.0,
    }];

    let query = "nonexistent".to_string();

    let result = search_pdf_text(pages, query);

    assert!(result.is_ok());
    let search_results = result.unwrap();
    assert_eq!(search_results.len(), 0);
}

#[test]
fn test_search_pdf_text_empty_pages() {
    let pages = vec![];
    let query = "test".to_string();

    let result = search_pdf_text(pages, query);

    assert!(result.is_ok());
    let search_results = result.unwrap();
    assert_eq!(search_results.len(), 0);
}

// Tests for error message formatting
#[test]
fn test_command_error_formatting() {
    // Test that errors are properly converted to strings
    let filepath = "".to_string(); // Empty path should cause an error

    let result = read_pdf_file(filepath);
    assert!(result.is_err());

    let error_msg = result.unwrap_err();
    // Error should be a string, not a complex type
    assert!(error_msg.contains("not found") || error_msg.contains("Invalid PDF"));
}
