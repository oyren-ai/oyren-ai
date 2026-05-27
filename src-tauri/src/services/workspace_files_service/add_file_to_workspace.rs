use crate::adapters::db::repositories;
use crate::adapters::os as os_adapter;
use crate::errors::PdfServiceError;
use crate::services::document::extract_content_to_file;
use crate::services::utils::file::extract_filename;
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AddFileResult {
    pub workspace_file_id: String,
    pub workspace_file_path: String,
    pub original_filename: String,
    pub was_deduplicated: bool,
}

pub async fn add_file_to_workspace(
    workspaces_base_dir: &Path,
    workspace_id: &str,
    source_file_path: &str,
) -> Result<AddFileResult, PdfServiceError> {
    // Step 1: Verify paths and extract filename
    let (workspace_dir, original_filename) =
        verify_paths_and_extract_filename(workspaces_base_dir, workspace_id, source_file_path)?;

    // Step 2: Check for deduplication (same hash)
    if let Some(duplicate) = find_duplicate_file(workspace_id, source_file_path).await? {
        return Ok(duplicate);
    }

    // Step 3: Generate file ID early
    let file_id = Uuid::new_v4().to_string();

    // Step 4: Create workspace_files/{file_id}/ directory
    let file_dir = workspace_dir.join("workspace_files").join(&file_id);
    std::fs::create_dir_all(&file_dir).map_err(|e| PdfServiceError::FileSystemError {
        message: format!("Failed to create file directory: {}", e),
    })?;

    // Step 5: Copy file into that directory
    let dest_path = file_dir.join(&original_filename);
    os_adapter::file::copy_file(source_file_path, dest_path.to_str().unwrap())
        .map_err(|e| PdfServiceError::FileError { source: e })?;

    // Step 6: Add to database with pre-generated ID
    let workspace_file = repositories::workspace_files::add_file_to_workspace_with_id(
        file_id.clone(),
        workspace_id.to_string(),
        dest_path.to_str().unwrap().to_string(),
        original_filename.clone(),
    )
    .await
    .map_err(|e| PdfServiceError::ProcessingError {
        message: format!("Failed to add file to database: {}", e),
    })?;

    // Step 7: Extract content to file (handles file type check internally)
    extract_content_to_file(
        workspaces_base_dir,
        workspace_id,
        &workspace_file.id,
        dest_path.to_str().unwrap(),
    )?;

    // Step 8: Return result
    Ok(AddFileResult {
        workspace_file_id: workspace_file.id,
        workspace_file_path: workspace_file.file_path,
        original_filename,
        was_deduplicated: false,
    })
}

async fn find_duplicate_file(
    workspace_id: &str,
    source_file_path: &str,
) -> Result<Option<AddFileResult>, PdfServiceError> {
    let source_hash = os_adapter::file::hash_file(source_file_path)
        .map_err(|e| PdfServiceError::FileError { source: e })?;

    let existing_files = repositories::workspace_files::list_workspace_files(workspace_id)
        .await
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("Failed to get workspace files: {}", e),
        })?;

    for existing_file in &existing_files {
        let existing_path = Path::new(&existing_file.file_path);
        if existing_path.exists() {
            if let Ok(existing_hash) = os_adapter::file::hash_file(&existing_file.file_path) {
                if existing_hash == source_hash {
                    return Ok(Some(AddFileResult {
                        workspace_file_id: existing_file.id.clone(),
                        workspace_file_path: existing_file.file_path.clone(),
                        original_filename: existing_file.file_name.to_string(),
                        was_deduplicated: true,
                    }));
                }
            }
        }
    }

    Ok(None)
}

fn verify_paths_and_extract_filename(
    workspaces_base_dir: &Path,
    workspace_id: &str,
    source_file_path: &str,
) -> Result<(PathBuf, String), PdfServiceError> {
    os_adapter::file::verify_file_exists(source_file_path)
        .map_err(|e| PdfServiceError::FileError { source: e })?;

    let workspace_dir = workspaces_base_dir.join(workspace_id);
    os_adapter::folder::verify_folder_exists(&workspace_dir)
        .map_err(|e| PdfServiceError::FileError { source: e })?;

    let original_filename = extract_filename(source_file_path)?;

    Ok((workspace_dir, original_filename))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::sqlite;
    use crate::adapters::db::test_utils::init_test_db;
    use std::fs;
    use tempfile::TempDir;

    async fn create_test_workspace(workspaces_base_dir: &Path) -> String {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();

        let workspace_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now();

        sqlx::query(
            r#"
            INSERT INTO workspaces (id, name, description, created_at, updated_at, last_accessed_at)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&workspace_id)
        .bind("Test Workspace")
        .bind("Test Description")
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .expect("Failed to create test workspace");

        // Create workspace directory
        let workspace_dir = workspaces_base_dir.join(&workspace_id);
        fs::create_dir_all(&workspace_dir).expect("Failed to create workspace directory");

        workspace_id
    }

    #[tokio::test]
    async fn test_add_file_to_workspace_success() {
        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();

        let workspace_id = create_test_workspace(&workspaces_dir).await;

        // Create a source PDF file
        let source_dir = temp_dir.path().join("source");
        fs::create_dir(&source_dir).unwrap();
        let source_pdf = source_dir.join("test.pdf");
        fs::write(&source_pdf, b"PDF content here").unwrap();

        let result =
            add_file_to_workspace(&workspaces_dir, &workspace_id, source_pdf.to_str().unwrap())
                .await;

        assert!(result.is_ok());
        let add_result = result.unwrap();

        // Verify the file was copied
        let workspace_file = Path::new(&add_result.workspace_file_path);
        assert!(workspace_file.exists());

        // Verify file lives inside workspace_files/{file_id}/
        assert!(add_result.workspace_file_path.contains("workspace_files"));
        assert!(add_result
            .workspace_file_path
            .contains(&add_result.workspace_file_id));

        // Verify file content matches
        let copied_content = fs::read(workspace_file).unwrap();
        assert_eq!(copied_content, b"PDF content here");

        // Verify original filename preserved
        assert_eq!(add_result.original_filename, "test.pdf");
        assert!(!add_result.was_deduplicated);
    }

    #[tokio::test]
    async fn test_add_file_source_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();

        let workspace_id = create_test_workspace(&workspaces_dir).await;

        let result =
            add_file_to_workspace(&workspaces_dir, &workspace_id, "/non/existent/file.pdf").await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_add_file_deduplication_same_hash() {
        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();

        let workspace_id = create_test_workspace(&workspaces_dir).await;

        // Create first PDF
        let source_dir = temp_dir.path().join("source");
        fs::create_dir(&source_dir).unwrap();
        let pdf1 = source_dir.join("file1.pdf");
        fs::write(&pdf1, b"Same content").unwrap();

        // Add first PDF
        let result1 =
            add_file_to_workspace(&workspaces_dir, &workspace_id, pdf1.to_str().unwrap()).await;
        assert!(result1.is_ok());

        // Create second PDF with same content but different name
        let pdf2 = source_dir.join("file2.pdf");
        fs::write(&pdf2, b"Same content").unwrap();

        // Add second PDF
        let result2 =
            add_file_to_workspace(&workspaces_dir, &workspace_id, pdf2.to_str().unwrap()).await;
        assert!(result2.is_ok());

        let add_result2 = result2.unwrap();

        // Verify deduplication occurred
        assert!(add_result2.was_deduplicated);

        // Verify both point to same physical file
        let copy1_path = result1.unwrap().workspace_file_path;
        let copy2_path = add_result2.workspace_file_path;

        let content1 = fs::read(&copy1_path).unwrap();
        let content2 = fs::read(&copy2_path).unwrap();
        assert_eq!(content1, content2);
    }

    #[tokio::test]
    async fn test_add_file_same_name_different_content() {
        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();

        let workspace_id = create_test_workspace(&workspaces_dir).await;

        // Create first PDF
        let source_dir = temp_dir.path().join("source");
        fs::create_dir(&source_dir).unwrap();
        let pdf1 = source_dir.join("document.pdf");
        fs::write(&pdf1, b"Content A").unwrap();

        // Add first PDF
        let result1 =
            add_file_to_workspace(&workspaces_dir, &workspace_id, pdf1.to_str().unwrap()).await;
        assert!(result1.is_ok());

        // Create second PDF with same name but different content
        fs::write(&pdf1, b"Content B").unwrap();

        // Add second PDF
        let result2 =
            add_file_to_workspace(&workspaces_dir, &workspace_id, pdf1.to_str().unwrap()).await;
        assert!(result2.is_ok());

        let add_result1 = result1.unwrap();
        let add_result2 = result2.unwrap();

        // Verify files are in different directories (isolated by file_id)
        assert_ne!(
            add_result1.workspace_file_path,
            add_result2.workspace_file_path
        );
        assert_ne!(
            add_result1.workspace_file_id,
            add_result2.workspace_file_id
        );

        // Both keep original filename but in different file_id dirs
        assert!(add_result1.workspace_file_path.ends_with("document.pdf"));
        assert!(add_result2.workspace_file_path.ends_with("document.pdf"));
        assert!(!add_result2.was_deduplicated);

        // Verify both files exist with different content
        let content1 = fs::read(&add_result1.workspace_file_path).unwrap();
        let content2 = fs::read(&add_result2.workspace_file_path).unwrap();
        assert_ne!(content1, content2);
    }

    #[tokio::test]
    async fn test_add_file_creates_workspace_dir_if_missing() {
        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();

        let workspace_id = create_test_workspace(&workspaces_dir).await;

        // Delete the workspace directory to test recreation
        let workspace_dir = workspaces_dir.join(&workspace_id);
        fs::remove_dir(&workspace_dir).unwrap();
        assert!(!workspace_dir.exists());

        // Create source PDF
        let source_dir = temp_dir.path().join("source");
        fs::create_dir(&source_dir).unwrap();
        let source_pdf = source_dir.join("test.pdf");
        fs::write(&source_pdf, b"PDF content").unwrap();

        let result =
            add_file_to_workspace(&workspaces_dir, &workspace_id, source_pdf.to_str().unwrap())
                .await;

        assert!(result.is_ok());

        // Verify workspace directory was recreated
        assert!(workspace_dir.exists());

        // Verify workspace_files subdirectory was created
        let workspace_files_dir = workspace_dir.join("workspace_files");
        assert!(workspace_files_dir.exists());
    }
}
