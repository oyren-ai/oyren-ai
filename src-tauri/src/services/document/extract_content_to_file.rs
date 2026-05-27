use crate::adapters::os as os_adapter;
use crate::errors::PdfServiceError;
use crate::services::document::pdf::extract_pdf_sync;
use std::path::Path;

/// Extract file content and save to workspace extracts folder
/// Returns None if file type is not supported
/// Saves to: {workspaces_base_dir}/{workspace_id}/extracts/pdf/{workspace_file_id}.md
pub fn extract_content_to_file(
    workspaces_base_dir: &Path,
    workspace_id: &str,
    workspace_file_id: &str,
    source_file_path: &str,
) -> Result<Option<String>, PdfServiceError> {
    // Check if file is a supported type
    if !source_file_path.to_lowercase().ends_with(".pdf") {
        return Ok(None);
    }

    // Check if extract already exists
    let extracts_dir = workspaces_base_dir
        .join(workspace_id)
        .join("extracts")
        .join("pdf");
    let output_path = extracts_dir.join(format!("{}.md", workspace_file_id));

    if output_path.exists() {
        return Ok(Some(output_path.to_str().unwrap().to_string()));
    }

    // Extract PDF content
    let result = extract_pdf_sync(source_file_path)?;

    // Combine all page texts
    let combined_text: String = result
        .pages
        .iter()
        .map(|page| page.text.as_str())
        .collect::<Vec<_>>()
        .join("\n\n");

    // Create extracts directory
    os_adapter::folder::verify_folder_exists(&extracts_dir)
        .map_err(|e| PdfServiceError::FileError { source: e })?;

    // Save to file
    os_adapter::file::write_file(&output_path, &combined_text)
        .map_err(|e| PdfServiceError::FileError { source: e })?;

    Ok(Some(output_path.to_str().unwrap().to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_extract_and_save_success() {
        let temp_dir = TempDir::new().unwrap();
        let workspace_id = "test-workspace";
        let workspace_file_id = "file-123";

        let workspace_dir = temp_dir.path().join(workspace_id);
        fs::create_dir_all(&workspace_dir).unwrap();

        let pdf_path = temp_dir.path().join("test.pdf");
        let pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        fs::write(&pdf_path, pdf_content).unwrap();

        let result = extract_content_to_file(
            temp_dir.path(),
            workspace_id,
            workspace_file_id,
            pdf_path.to_str().unwrap(),
        );

        assert!(result.is_ok());
        let output_path = result.unwrap().unwrap();

        assert!(Path::new(&output_path).exists());
        let expected_subdir = Path::new("extracts").join("pdf");
        assert!(output_path.contains(expected_subdir.to_str().unwrap()));
        assert!(output_path.ends_with(".md"));
    }

    #[test]
    fn test_creates_extracts_directory() {
        let temp_dir = TempDir::new().unwrap();
        let workspace_id = "test-workspace-2";
        let workspace_file_id = "file-456";

        let workspace_dir = temp_dir.path().join(workspace_id);
        fs::create_dir_all(&workspace_dir).unwrap();

        let extracts_dir = workspace_dir.join("extracts").join("pdf");
        assert!(!extracts_dir.exists());

        let pdf_path = temp_dir.path().join("test2.pdf");
        let pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        fs::write(&pdf_path, pdf_content).unwrap();

        let result = extract_content_to_file(
            temp_dir.path(),
            workspace_id,
            workspace_file_id,
            pdf_path.to_str().unwrap(),
        );

        assert!(result.is_ok());
        assert!(extracts_dir.exists());
    }

    #[test]
    fn test_unsupported_file_returns_none() {
        let temp_dir = TempDir::new().unwrap();
        let workspace_id = "test-workspace-3";

        fs::create_dir_all(temp_dir.path().join(workspace_id)).unwrap();

        let txt_path = temp_dir.path().join("test.txt");
        fs::write(&txt_path, "some text").unwrap();

        let result = extract_content_to_file(
            temp_dir.path(),
            workspace_id,
            "file-789",
            txt_path.to_str().unwrap(),
        );

        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }

    #[test]
    fn test_skips_extraction_if_already_exists() {
        let temp_dir = TempDir::new().unwrap();
        let workspace_id = "test-workspace-5";
        let workspace_file_id = "file-existing";

        // Create workspace and extracts directory
        let extracts_dir = temp_dir
            .path()
            .join(workspace_id)
            .join("extracts")
            .join("pdf");
        fs::create_dir_all(&extracts_dir).unwrap();

        // Create existing extract file
        let existing_extract = extracts_dir.join(format!("{}.md", workspace_file_id));
        fs::write(&existing_extract, "existing content").unwrap();

        // Create PDF (won't be read since extract exists)
        let pdf_path = temp_dir.path().join("test.pdf");
        fs::write(&pdf_path, b"invalid pdf").unwrap();

        let result = extract_content_to_file(
            temp_dir.path(),
            workspace_id,
            workspace_file_id,
            pdf_path.to_str().unwrap(),
        );

        assert!(result.is_ok());
        let output_path = result.unwrap().unwrap();

        // Verify it returned existing path without re-extracting
        assert_eq!(output_path, existing_extract.to_str().unwrap());

        // Verify content wasn't overwritten
        let content = fs::read_to_string(&existing_extract).unwrap();
        assert_eq!(content, "existing content");
    }

    #[test]
    fn test_file_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let workspace_id = "test-workspace-4";

        fs::create_dir_all(temp_dir.path().join(workspace_id)).unwrap();

        let result = extract_content_to_file(
            temp_dir.path(),
            workspace_id,
            "file-999",
            "/nonexistent/file.pdf",
        );

        assert!(result.is_err());
    }
}
