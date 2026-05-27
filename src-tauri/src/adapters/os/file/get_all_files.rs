use crate::errors::{io_error_to_file_error, FileError};
use std::{
    fs,
    path::{Path, PathBuf},
};
pub struct FileContent {
    pub path: PathBuf,
    pub content: Vec<u8>,
}

pub fn get_all_files(dir_path: &Path) -> Result<Vec<FileContent>, FileError> {
    if !dir_path.exists() {
        return Err(FileError::NotFound {
            path: dir_path.display().to_string(),
        });
    }

    let mut results = Vec::new();
    collect_files_recursive(dir_path, &mut results)?;
    Ok(results)
}

fn collect_files_recursive(dir_path: &Path, results: &mut Vec<FileContent>) -> Result<(), FileError> {
    for entry in fs::read_dir(dir_path).map_err(io_error_to_file_error)? {
        let entry = entry.map_err(io_error_to_file_error)?;
        let path = entry.path();
        let metadata = entry.metadata().map_err(io_error_to_file_error)?;

        if metadata.is_file() {
            let content = fs::read(&path).map_err(io_error_to_file_error)?;
            results.push(FileContent { path, content });
        } else if metadata.is_dir() {
            collect_files_recursive(&path, results)?;
        }
    }
    Ok(())
}
