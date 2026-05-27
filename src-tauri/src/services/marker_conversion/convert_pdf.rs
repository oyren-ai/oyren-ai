use crate::adapters::db::{repositories, sqlite};
use crate::adapters::marker_api;
use crate::errors::{marker_api_error_to_pdf_service_error, PdfServiceError};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionResult {
    pub markdown_file_id: String,
    pub markdown_file_path: String,
    pub markdown_file_name: String,
    pub image_count: usize,
}

#[derive(Clone, Serialize)]
struct ConversionProgress {
    workspace_file_id: String,
    progress: u8,
    status: String,
}

fn emit_progress(app: &AppHandle, file_id: &str, progress: u8, status: &str) {
    let _ = app.emit(
        "conversion-progress",
        ConversionProgress {
            workspace_file_id: file_id.to_string(),
            progress,
            status: status.to_string(),
        },
    );
}

pub async fn convert_pdf_to_markdown(
    app: &AppHandle,
    workspaces_base_dir: &Path,
    workspace_id: &str,
    source_file_id: &str,
    auth_token: &str,
    estimated_pages: Option<u32>,
    api_base_url: Option<&str>,
) -> Result<ConversionResult, PdfServiceError> {
    tracing::info!("[Marker] convert_pdf_to_markdown called — workspace={}, file_id={}", workspace_id, source_file_id);

    let pool = sqlite::get_db_pool().map_err(|e| PdfServiceError::DatabaseError {
        message: e.to_string(),
    })?;

    let source_file = repositories::workspace_files::get_workspace_file(pool, source_file_id)
        .await
        .map_err(|e| PdfServiceError::DatabaseError { message: e })?;

    tracing::info!("[Marker] Source file: {}", source_file.file_name);
    emit_progress(app, source_file_id, 10, "uploading");

    let zip_bytes = marker_api::client::convert_pdf(
        api_base_url,
        &source_file.file_path,
        auth_token,
        estimated_pages,
    )
        .await
        .map_err(|e| {
            tracing::error!("[Marker] Conversion failed: {:?}", e);
            marker_api_error_to_pdf_service_error(e)
        })?;

    tracing::info!("[Marker] API returned {} bytes, extracting zip...", zip_bytes.len());
    emit_progress(app, source_file_id, 70, "extracting");

    let file_id = Uuid::new_v4().to_string();
    let file_dir = workspaces_base_dir
        .join(workspace_id)
        .join("workspace_files")
        .join(&file_id);

    std::fs::create_dir_all(&file_dir).map_err(|e| PdfServiceError::FileSystemError {
        message: format!("Failed to create conversion output dir: {}", e),
    })?;

    let extraction = marker_api::extract_zip::extract_zip_to_directory(&zip_bytes, &file_dir)
        .map_err(marker_api_error_to_pdf_service_error)?;

    emit_progress(app, source_file_id, 85, "saving");

    // Move all extracted images into {file_dir}/images/ so that the rewritten
    // markdown references (./images/filename) resolve correctly regardless of
    // how deeply nested the ZIP entries were.
    consolidate_images(&file_dir, &extraction.image_paths)?;

    let pdf_stem = Path::new(&source_file.file_name)
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let md_file_name = format!("{}.md", pdf_stem);
    let final_md_path = file_dir.join(&md_file_name);

    if extraction.markdown_path != final_md_path {
        std::fs::rename(&extraction.markdown_path, &final_md_path).map_err(|e| {
            PdfServiceError::FileSystemError {
                message: format!("Failed to rename markdown file: {}", e),
            }
        })?;
    }

    rewrite_image_paths(&final_md_path)?;

    let metadata = serde_json::json!({ "source_pdf_id": source_file_id }).to_string();
    let md_path_str = final_md_path.to_str().unwrap_or_default().to_string();

    repositories::workspace_files::add_file_to_workspace_with_metadata(
        workspace_id.to_string(),
        md_path_str.clone(),
        md_file_name.clone(),
        Some(metadata),
    )
    .await
    .map_err(|e| PdfServiceError::DatabaseError { message: e })?;

    emit_progress(app, source_file_id, 100, "complete");

    tracing::info!("[Marker] Conversion complete — {} ({} images)", md_file_name, extraction.image_paths.len());

    Ok(ConversionResult {
        markdown_file_id: file_id,
        markdown_file_path: md_path_str,
        markdown_file_name: md_file_name,
        image_count: extraction.image_paths.len(),
    })
}

/// Move all extracted images into `{file_dir}/images/`, flattening any nested
/// subdirectories that may come from the Marker API ZIP structure.
fn consolidate_images(file_dir: &Path, image_paths: &[PathBuf]) -> Result<(), PdfServiceError> {
    if image_paths.is_empty() {
        return Ok(());
    }

    let canonical_images_dir = file_dir.join("images");
    std::fs::create_dir_all(&canonical_images_dir).map_err(|e| PdfServiceError::FileSystemError {
        message: format!("Failed to create images dir: {}", e),
    })?;

    for src in image_paths {
        if !src.exists() {
            continue;
        }
        let file_name = match src.file_name() {
            Some(n) => n.to_os_string(),
            None => continue,
        };
        let dest = canonical_images_dir.join(&file_name);
        // Skip if the image is already in the correct location
        if src == &dest {
            continue;
        }
        // Move (or copy+delete for cross-device) into the canonical dir
        if std::fs::rename(src, &dest).is_err() {
            std::fs::copy(src, &dest).map_err(|e| PdfServiceError::FileSystemError {
                message: format!("Failed to copy image {}: {}", file_name.to_string_lossy(), e),
            })?;
            let _ = std::fs::remove_file(src);
        }
    }

    // Clean up empty directories left behind after moving images
    cleanup_empty_dirs(file_dir, &canonical_images_dir);

    Ok(())
}

/// Remove empty directories under `root`, excluding `keep`.
fn cleanup_empty_dirs(root: &Path, keep: &Path) {
    if let Ok(entries) = std::fs::read_dir(root) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() && path != keep {
                cleanup_empty_dirs(&path, keep);
                let _ = std::fs::remove_dir(&path); // only succeeds if empty
            }
        }
    }
}

fn rewrite_image_paths(md_path: &Path) -> Result<(), PdfServiceError> {
    let content = std::fs::read_to_string(md_path).map_err(|e| {
        PdfServiceError::FileSystemError {
            message: format!("Failed to read markdown for image path rewrite: {}", e),
        }
    })?;

    let rewritten = regex::Regex::new(r"!\[([^\]]*)\]\(([^)]+)\)")
        .unwrap()
        .replace_all(&content, |caps: &regex::Captures| {
            let alt = &caps[1];
            let path = caps[2].trim();
            if path.starts_with("data:") {
                return format!("![{}]({})", alt, path);
            }
            let p = Path::new(path);
            if let Some(name) = p.file_name().and_then(|n| n.to_str()) {
                format!("![{}](./images/{})", alt, name)
            } else {
                let stem = p
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy();
                format!("![{}](./images/{}.png)", alt, stem)
            }
        });

    std::fs::write(md_path, rewritten.as_ref()).map_err(|e| {
        PdfServiceError::FileSystemError {
            message: format!("Failed to write rewritten markdown: {}", e),
        }
    })?;

    Ok(())
}
