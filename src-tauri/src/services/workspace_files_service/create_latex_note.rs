use crate::adapters::db::{models::WorkspaceFile, repositories};
use crate::errors::PdfServiceError;
use std::path::Path;
use uuid::Uuid;

const DEFAULT_LATEX_CONTENT: &str = "\\documentclass{article}\n\\begin{document}\n\n\n\\end{document}";

/// Create a new LaTeX note in a workspace
/// Creates a workspace_files/{file_id}/ directory, writes the .tex file, and records in DB
pub async fn create_latex_note(
    workspaces_base_dir: &Path,
    workspace_id: &str,
    note_name: String,
) -> Result<WorkspaceFile, PdfServiceError> {
    let file_id = Uuid::new_v4().to_string();

    let file_name = if note_name.trim().to_lowercase().ends_with(".tex") {
        note_name.trim().to_string()
    } else {
        format!("{}.tex", note_name.trim())
    };

    let file_dir = workspaces_base_dir
        .join(workspace_id)
        .join("workspace_files")
        .join(&file_id);
    std::fs::create_dir_all(&file_dir).map_err(|e| PdfServiceError::FileSystemError {
        message: format!("Failed to create note directory: {}", e),
    })?;

    let file_path = file_dir.join(&file_name);
    std::fs::write(&file_path, DEFAULT_LATEX_CONTENT).map_err(|e| {
        PdfServiceError::FileSystemError {
            message: format!("Failed to create LaTeX note file: {}", e),
        }
    })?;

    let workspace_file = repositories::workspace_files::add_file_to_workspace_with_id(
        file_id,
        workspace_id.to_string(),
        file_path.to_str().unwrap().to_string(),
        file_name,
    )
    .await
    .map_err(|e| PdfServiceError::ProcessingError {
        message: format!("Failed to add LaTeX note to database: {}", e),
    })?;

    Ok(workspace_file)
}
