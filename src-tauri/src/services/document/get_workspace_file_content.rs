use crate::adapters::db::repositories::workspace_files;
use crate::adapters::db::sqlite;
use crate::adapters::os as os_adapter;
use crate::errors::PdfServiceError;
use crate::services::document::extract_content_to_file;
use std::path::Path;

/// Get the text content of a workspace file.
/// For markdown files, reads the file directly.
/// For PDFs, returns previously extracted content or extracts it first.
pub async fn get_workspace_file_content(
    workspaces_base_dir: &Path,
    file_id: &str,
) -> Result<String, PdfServiceError> {
    let pool = sqlite::get_db_pool().map_err(|e| PdfServiceError::DatabaseError { message: e })?;

    let file = workspace_files::get_workspace_file(pool, file_id)
        .await
        .map_err(|e| PdfServiceError::DatabaseError { message: e })?;

    // Markdown and LaTeX files: read content directly
    if file.file_name.to_lowercase().ends_with(".md") {
        return read_file_as_string(&file.file_path);
    }
    if file.file_name.to_lowercase().ends_with(".tex") {
        return read_file_as_string(&file.file_path);
    }

    // PDF files: check for extracted content or extract
    get_pdf_extracted_content(workspaces_base_dir, &file, file_id)
}

fn read_file_as_string(path: &str) -> Result<String, PdfServiceError> {
    let bytes = os_adapter::file::read_file(path)
        .map_err(|e| PdfServiceError::FileError { source: e })?;
    String::from_utf8(bytes).map_err(|e| PdfServiceError::ProcessingError {
        message: e.to_string(),
    })
}

fn get_pdf_extracted_content(
    workspaces_base_dir: &Path,
    file: &crate::adapters::db::models::WorkspaceFile,
    file_id: &str,
) -> Result<String, PdfServiceError> {
    let extract_path = workspaces_base_dir
        .join(&file.workspace_id)
        .join("extracts")
        .join("pdf")
        .join(format!("{}.md", file_id));

    if extract_path.exists() {
        return read_file_as_string(extract_path.to_str().unwrap());
    }

    let _extract_result = extract_content_to_file(
        workspaces_base_dir,
        &file.workspace_id,
        file_id,
        &file.file_path,
    )?;

    if extract_path.exists() {
        read_file_as_string(extract_path.to_str().unwrap())
    } else {
        Err(PdfServiceError::UnsupportedFileType {
            extension: file.file_path.split('.').last().unwrap_or("").to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_workspace_file_content_requires_db() {
        let temp_dir = tempfile::TempDir::new().unwrap();
        let result = get_workspace_file_content(temp_dir.path(), "nonexistent").await;
        assert!(result.is_err());
    }
}
