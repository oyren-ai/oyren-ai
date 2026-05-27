use crate::errors::MarkerApiError;
use std::io::Read;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ZipExtractionResult {
    pub markdown_path: PathBuf,
    pub image_paths: Vec<PathBuf>,
}

pub fn extract_zip_to_directory(
    zip_bytes: &[u8],
    target_dir: &Path,
) -> Result<ZipExtractionResult, MarkerApiError> {
    let cursor = std::io::Cursor::new(zip_bytes);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| {
        MarkerApiError::ZipExtractionError {
            message: format!("Failed to open zip archive: {}", e),
        }
    })?;

    let mut markdown_path: Option<PathBuf> = None;
    let mut image_paths: Vec<PathBuf> = Vec::new();

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| {
            MarkerApiError::ZipExtractionError {
                message: format!("Failed to read zip entry: {}", e),
            }
        })?;

        let outpath = target_dir.join(file.mangled_name());

        if file.name().ends_with('/') {
            std::fs::create_dir_all(&outpath).map_err(|e| {
                MarkerApiError::ZipExtractionError {
                    message: format!("Failed to create directory: {}", e),
                }
            })?;
        } else {
            if let Some(parent) = outpath.parent() {
                std::fs::create_dir_all(parent).map_err(|e| {
                    MarkerApiError::ZipExtractionError {
                        message: format!("Failed to create parent dir: {}", e),
                    }
                })?;
            }

            let mut contents = Vec::new();
            file.read_to_end(&mut contents).map_err(|e| {
                MarkerApiError::ZipExtractionError {
                    message: format!("Failed to read zip file entry: {}", e),
                }
            })?;

            std::fs::write(&outpath, &contents).map_err(|e| {
                MarkerApiError::ZipExtractionError {
                    message: format!("Failed to write extracted file: {}", e),
                }
            })?;

            let name_lower = file.name().to_lowercase();
            if name_lower.ends_with(".md") {
                markdown_path = Some(outpath.clone());
            } else if is_image_file(&name_lower) {
                image_paths.push(outpath.clone());
            }
        }
    }

    let markdown_path = markdown_path.ok_or_else(|| MarkerApiError::ZipExtractionError {
        message: "No markdown file found in zip archive".to_string(),
    })?;

    Ok(ZipExtractionResult {
        markdown_path,
        image_paths,
    })
}

fn is_image_file(name: &str) -> bool {
    name.ends_with(".png")
        || name.ends_with(".jpg")
        || name.ends_with(".jpeg")
        || name.ends_with(".gif")
        || name.ends_with(".webp")
        || name.ends_with(".svg")
}
