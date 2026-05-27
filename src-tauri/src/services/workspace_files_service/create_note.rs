use crate::adapters::db::{models::WorkspaceFile, repositories};
use crate::errors::PdfServiceError;
use std::path::Path;
use uuid::Uuid;

/// Create a new markdown note in a workspace
/// Creates a workspace_files/{file_id}/ directory, writes the .md file, and records in DB
pub async fn create_note(
    workspaces_base_dir: &Path,
    workspace_id: &str,
    note_name: String,
) -> Result<WorkspaceFile, PdfServiceError> {
    // Step 1: Generate file ID early
    let file_id = Uuid::new_v4().to_string();

    // Step 2: Generate filename with .md extension
    let file_name = if note_name.ends_with(".md") {
        note_name.clone()
    } else {
        format!("{}.md", note_name)
    };

    // Step 3: Create workspace_files/{file_id}/ directory
    let file_dir = workspaces_base_dir
        .join(workspace_id)
        .join("workspace_files")
        .join(&file_id);
    std::fs::create_dir_all(&file_dir).map_err(|e| PdfServiceError::FileSystemError {
        message: format!("Failed to create note directory: {}", e),
    })?;

    // Step 4: Create the markdown file inside the directory
    let file_path = file_dir.join(&file_name);
    std::fs::write(&file_path, "# New Note\n\nStart writing here...").map_err(|e| {
        PdfServiceError::FileSystemError {
            message: format!("Failed to create note file: {}", e),
        }
    })?;

    // Step 5: Add file to database with pre-generated ID
    let workspace_file = repositories::workspace_files::add_file_to_workspace_with_id(
        file_id,
        workspace_id.to_string(),
        file_path.to_str().unwrap().to_string(),
        file_name,
    )
    .await
    .map_err(|e| PdfServiceError::ProcessingError {
        message: format!("Failed to add note to database: {}", e),
    })?;

    Ok(workspace_file)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::sqlite;
    use crate::adapters::db::test_utils::init_test_db;
    use std::fs;
    use tempfile::TempDir;

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
    async fn test_create_note_success() {
        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();
        let workspace_id = create_test_workspace(&workspaces_dir).await;

        let result =
            create_note(&workspaces_dir, &workspace_id, "My Note".to_string()).await;
        assert!(result.is_ok());

        let wf = result.unwrap();
        assert_eq!(wf.file_name, "My Note.md");
        assert!(wf.file_path.contains("workspace_files"));
        assert!(wf.file_path.contains(&wf.id));

        let content = fs::read_to_string(&wf.file_path).unwrap();
        assert!(content.contains("# New Note"));
    }

    #[tokio::test]
    async fn test_create_note_with_md_extension() {
        let temp_dir = TempDir::new().unwrap();
        let workspaces_dir = temp_dir.path().join("workspaces");
        fs::create_dir(&workspaces_dir).unwrap();
        let workspace_id = create_test_workspace(&workspaces_dir).await;

        let result =
            create_note(&workspaces_dir, &workspace_id, "notes.md".to_string()).await;
        assert!(result.is_ok());

        let wf = result.unwrap();
        assert_eq!(wf.file_name, "notes.md");
    }
}
