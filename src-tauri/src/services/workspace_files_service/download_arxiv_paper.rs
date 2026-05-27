use crate::adapters::db::repositories;
use crate::errors::PdfServiceError;
use std::path::Path;
use uuid::Uuid;

#[cfg(not(test))]
use crate::services::document::extract_content_to_file;

#[cfg(test)]
use tests::{mock_extract_content_to_file as extract_content_to_file, mock_fetch_pdf_bytes};

const PDF_MAGIC_BYTES: &[u8] = b"%PDF";

#[cfg(not(test))]
async fn fetch_pdf_bytes(pdf_url: &str) -> Result<Vec<u8>, PdfServiceError> {
    let response = reqwest::get(pdf_url)
        .await
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("Failed to download from URL: {}", e),
        })?;

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_lowercase();

    let bytes = response
        .bytes()
        .await
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("Failed to read response bytes: {}", e),
        })?;

    let data = bytes.to_vec();
    validate_pdf_content(&content_type, &data)?;
    Ok(data)
}

fn validate_pdf_content(content_type: &str, data: &[u8]) -> Result<(), PdfServiceError> {
    let is_pdf_content_type = content_type.contains("application/pdf");
    let has_pdf_magic = data.len() >= PDF_MAGIC_BYTES.len() && &data[..PDF_MAGIC_BYTES.len()] == PDF_MAGIC_BYTES;

    if !is_pdf_content_type && !has_pdf_magic {
        return Err(PdfServiceError::ProcessingError {
            message: "The URL does not point to a PDF file".to_string(),
        });
    }

    Ok(())
}

pub async fn download_arxiv_paper(
    workspaces_base_dir: &Path,
    workspace_id: &str,
    pdf_url: &str,
    filename: &str,
) -> Result<String, PdfServiceError> {
    let workspace_dir = workspaces_base_dir.join(workspace_id);
    let file_id = Uuid::new_v4().to_string();
    let file_dir = workspace_dir.join("workspace_files").join(&file_id);

    std::fs::create_dir_all(&file_dir).map_err(|e| PdfServiceError::FileSystemError {
        message: format!("Failed to create file directory: {}", e),
    })?;

    let dest_path = file_dir.join(filename);

    #[cfg(not(test))]
    let bytes = fetch_pdf_bytes(pdf_url).await?;
    #[cfg(test)]
    let bytes = mock_fetch_pdf_bytes(pdf_url).await?;

    std::fs::write(&dest_path, &bytes).map_err(|e| PdfServiceError::FileSystemError {
        message: format!("Failed to write PDF file: {}", e),
    })?;

    let _workspace_file = repositories::workspace_files::add_file_to_workspace_with_id(
        file_id.clone(),
        workspace_id.to_string(),
        dest_path.to_str().unwrap().to_string(),
        filename.to_string(),
    )
    .await
    .map_err(|e| PdfServiceError::ProcessingError {
        message: format!("Failed to add file to database: {}", e),
    })?;

    extract_content_to_file(
        workspaces_base_dir,
        workspace_id,
        &file_id,
        dest_path.to_str().unwrap(),
    )?;

    Ok(file_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::sqlite;
    use crate::adapters::db::test_utils::init_test_db;
    use std::cell::RefCell;
    use std::fs;
    use tempfile::TempDir;

    thread_local! {
        static MOCK_FETCH: RefCell<Option<Result<Vec<u8>, PdfServiceError>>> = RefCell::new(None);
        static MOCK_EXTRACT: RefCell<Option<Result<Option<String>, PdfServiceError>>> = RefCell::new(None);
    }

    pub async fn mock_fetch_pdf_bytes(_url: &str) -> Result<Vec<u8>, PdfServiceError> {
        MOCK_FETCH.with(|m| {
            m.borrow()
                .as_ref()
                .cloned()
                .unwrap_or_else(|| {
                    Err(PdfServiceError::ProcessingError {
                        message: "No mock fetch result configured".to_string(),
                    })
                })
        })
    }

    pub fn mock_extract_content_to_file(
        _base: &Path,
        _ws_id: &str,
        _file_id: &str,
        _path: &str,
    ) -> Result<Option<String>, PdfServiceError> {
        MOCK_EXTRACT.with(|m| {
            m.borrow().as_ref().cloned().unwrap_or(Ok(None))
        })
    }

    fn set_mock_fetch(result: Result<Vec<u8>, PdfServiceError>) {
        MOCK_FETCH.with(|m| *m.borrow_mut() = Some(result));
    }

    fn set_mock_extract(result: Result<Option<String>, PdfServiceError>) {
        MOCK_EXTRACT.with(|m| *m.borrow_mut() = Some(result));
    }

    fn reset_mocks() {
        MOCK_FETCH.with(|m| *m.borrow_mut() = None);
        MOCK_EXTRACT.with(|m| *m.borrow_mut() = None);
    }

    async fn create_test_workspace(workspaces_dir: &Path) -> String {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();
        let workspace_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        sqlx::query(
            r#"INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at)
               VALUES (?, ?, ?, ?, ?)"#,
        )
        .bind(&workspace_id)
        .bind("Test Workspace")
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .unwrap();

        let workspace_dir = workspaces_dir.join(&workspace_id);
        fs::create_dir_all(&workspace_dir).unwrap();
        workspace_id
    }

    #[tokio::test]
    async fn test_download_success() {
        reset_mocks();
        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();
        let workspace_id = create_test_workspace(&workspaces_dir).await;

        set_mock_fetch(Ok(b"fake pdf content".to_vec()));
        set_mock_extract(Ok(None));

        let result = download_arxiv_paper(
            &workspaces_dir,
            &workspace_id,
            "http://example.com/paper.pdf",
            "paper.pdf",
        )
        .await;

        assert!(result.is_ok());
        let file_id = result.unwrap();
        assert!(!file_id.is_empty());

        let dest = workspaces_dir
            .join(&workspace_id)
            .join("workspace_files")
            .join(&file_id)
            .join("paper.pdf");
        assert!(dest.exists());
        assert_eq!(fs::read(&dest).unwrap(), b"fake pdf content");

        reset_mocks();
    }

    #[tokio::test]
    async fn test_create_dir_fails() {
        reset_mocks();
        let temp_dir = TempDir::new().unwrap();
        let blocker_file = temp_dir.path().join("not_a_dir");
        fs::write(&blocker_file, "blocker").unwrap();

        let result = download_arxiv_paper(
            &blocker_file,
            "ws-id",
            "http://example.com/paper.pdf",
            "paper.pdf",
        )
        .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            PdfServiceError::FileSystemError { message } => {
                assert!(message.contains("Failed to create file directory"));
            }
            other => panic!("Expected FileSystemError, got {:?}", other),
        }
        reset_mocks();
    }

    #[tokio::test]
    async fn test_fetch_fails() {
        reset_mocks();
        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();
        let workspace_id = create_test_workspace(&workspaces_dir).await;

        set_mock_fetch(Err(PdfServiceError::ProcessingError {
            message: "Failed to download PDF from ArXiv: connection refused".to_string(),
        }));

        let result = download_arxiv_paper(
            &workspaces_dir,
            &workspace_id,
            "http://example.com/paper.pdf",
            "paper.pdf",
        )
        .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            PdfServiceError::ProcessingError { message } => {
                assert!(message.contains("Failed to download PDF from ArXiv"));
            }
            other => panic!("Expected ProcessingError, got {:?}", other),
        }
        reset_mocks();
    }

    #[tokio::test]
    async fn test_write_file_fails() {
        reset_mocks();
        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();
        let workspace_id = create_test_workspace(&workspaces_dir).await;

        set_mock_fetch(Ok(b"pdf data".to_vec()));

        // Use a filename with a subdirectory component so fs::write fails
        // (the subdirectory won't exist inside file_dir)
        let result = download_arxiv_paper(
            &workspaces_dir,
            &workspace_id,
            "http://example.com/paper.pdf",
            "nonexistent_sub/paper.pdf",
        )
        .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            PdfServiceError::FileSystemError { message } => {
                assert!(message.contains("Failed to write PDF file"));
            }
            other => panic!("Expected FileSystemError, got {:?}", other),
        }
        reset_mocks();
    }

    #[tokio::test]
    async fn test_db_add_fails() {
        reset_mocks();
        init_test_db().await;

        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();

        // Create directory but NOT a database record (foreign key violation)
        let fake_ws_id = Uuid::new_v4().to_string();
        let ws_dir = workspaces_dir.join(&fake_ws_id);
        fs::create_dir_all(&ws_dir).unwrap();

        set_mock_fetch(Ok(b"pdf data".to_vec()));
        set_mock_extract(Ok(None));

        let result = download_arxiv_paper(
            &workspaces_dir,
            &fake_ws_id,
            "http://example.com/paper.pdf",
            "paper.pdf",
        )
        .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            PdfServiceError::ProcessingError { message } => {
                assert!(message.contains("Failed to add file to database"));
            }
            other => panic!("Expected ProcessingError, got {:?}", other),
        }
        reset_mocks();
    }

    #[tokio::test]
    async fn test_extraction_fails() {
        reset_mocks();
        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();
        let workspace_id = create_test_workspace(&workspaces_dir).await;

        set_mock_fetch(Ok(b"pdf data".to_vec()));
        set_mock_extract(Err(PdfServiceError::ExtractionFailed {
            message: "PDF extraction failed".to_string(),
        }));

        let result = download_arxiv_paper(
            &workspaces_dir,
            &workspace_id,
            "http://example.com/paper.pdf",
            "paper.pdf",
        )
        .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            PdfServiceError::ExtractionFailed { message } => {
                assert!(message.contains("PDF extraction failed"));
            }
            other => panic!("Expected ExtractionFailed, got {:?}", other),
        }
        reset_mocks();
    }

    #[test]
    fn test_validate_pdf_content_with_magic_bytes() {
        let data = b"%PDF-1.4 fake content";
        assert!(validate_pdf_content("text/html", data).is_ok());
    }

    #[test]
    fn test_validate_pdf_content_with_content_type() {
        let data = b"not magic but valid";
        assert!(validate_pdf_content("application/pdf", data).is_ok());
    }

    #[test]
    fn test_validate_pdf_content_rejects_html() {
        let data = b"<html><body>Not a PDF</body></html>";
        let result = validate_pdf_content("text/html", data);
        assert!(result.is_err());
        match result.unwrap_err() {
            PdfServiceError::ProcessingError { message } => {
                assert!(message.contains("does not point to a PDF"));
            }
            other => panic!("Expected ProcessingError, got {:?}", other),
        }
    }

    #[test]
    fn test_validate_pdf_content_rejects_empty() {
        let result = validate_pdf_content("", b"");
        assert!(result.is_err());
    }
}
