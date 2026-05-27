use crate::adapters::db::repositories;
use crate::adapters::db::sqlite;
use crate::adapters::os as os_adapter;
use crate::errors::PdfServiceError;
use crate::services::workspace_files_service::AddFileResult;
use std::path::Path;
use uuid::Uuid;

pub async fn copy_file_to_workspace(
    workspaces_base_dir: &Path,
    workspace_file_id: &str,
    destination_workspace_id: &str,
) -> Result<AddFileResult, PdfServiceError> {
    let pool = sqlite::get_db_pool().map_err(|e| PdfServiceError::DatabaseError { message: e })?;

    let source_file = repositories::workspace_files::get_workspace_file(pool, workspace_file_id)
        .await
        .map_err(|e| PdfServiceError::DatabaseError { message: e })?;

    let dest_workspace_dir = workspaces_base_dir.join(destination_workspace_id);
    os_adapter::folder::verify_folder_exists(&dest_workspace_dir)
        .map_err(|e| PdfServiceError::FileError { source: e })?;

    let new_file_id = Uuid::new_v4().to_string();
    let new_file_dir = dest_workspace_dir.join("workspace_files").join(&new_file_id);

    let source_dir = Path::new(&source_file.file_path)
        .parent()
        .ok_or_else(|| PdfServiceError::FileSystemError {
            message: "Cannot determine source file parent directory".to_string(),
        })?;

    copy_dir_recursive(source_dir, &new_file_dir)?;

    let new_file_path = new_file_dir.join(&source_file.file_name);

    repositories::workspace_files::add_file_to_workspace_with_id(
        new_file_id.clone(),
        destination_workspace_id.to_string(),
        new_file_path.to_str().unwrap().to_string(),
        source_file.file_name.clone(),
    )
    .await
    .map_err(|e| PdfServiceError::ProcessingError {
        message: format!("Failed to add copied file to database: {}", e),
    })?;

    Ok(AddFileResult {
        workspace_file_id: new_file_id,
        workspace_file_path: new_file_path.to_str().unwrap().to_string(),
        original_filename: source_file.file_name,
        was_deduplicated: false,
    })
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), PdfServiceError> {
    std::fs::create_dir_all(dst).map_err(|e| PdfServiceError::FileSystemError {
        message: format!("Failed to create directory {:?}: {}", dst, e),
    })?;

    for entry in std::fs::read_dir(src).map_err(|e| PdfServiceError::FileSystemError {
        message: format!("Failed to read directory {:?}: {}", src, e),
    })? {
        let entry = entry.map_err(|e| PdfServiceError::FileSystemError {
            message: format!("Failed to read directory entry: {}", e),
        })?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            std::fs::copy(&src_path, &dst_path).map_err(|e| PdfServiceError::FileSystemError {
                message: format!("Failed to copy {:?} to {:?}: {}", src_path, dst_path, e),
            })?;
        }
    }

    Ok(())
}
