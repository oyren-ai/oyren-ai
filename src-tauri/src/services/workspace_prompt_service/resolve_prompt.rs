use crate::adapters::db::repositories::workspace_prompts;
use crate::adapters::db::sqlite;
use crate::errors::PdfServiceError;
use crate::services::document::get_workspace_file_content;
use crate::services::workspace_prompt_service::types::PromptBlock;
use std::path::Path;

pub async fn resolve_prompt(
    workspaces_base_dir: &Path,
    prompt_id: &str,
) -> Result<String, PdfServiceError> {
    let pool = sqlite::get_db_pool()
        .map_err(|e| PdfServiceError::DatabaseError { message: e })?;

    let prompt = workspace_prompts::get_workspace_prompt_by_id(pool, prompt_id)
        .await
        .map_err(|e| PdfServiceError::DatabaseError { message: e })?;

    let blocks: Vec<PromptBlock> = serde_json::from_str(&prompt.blocks)
        .map_err(|e| PdfServiceError::ProcessingError {
            message: format!("Invalid blocks JSON: {}", e),
        })?;

    resolve_blocks(workspaces_base_dir, &blocks).await
}

async fn resolve_blocks(
    workspaces_base_dir: &Path,
    blocks: &[PromptBlock],
) -> Result<String, PdfServiceError> {
    let mut parts: Vec<String> = Vec::new();

    for block in blocks {
        match block.block_type.as_str() {
            "text" => {
                if let Some(content) = &block.content {
                    parts.push(content.clone());
                }
            }
            "file" => {
                if let Some(file_id) = &block.file_id {
                    let content = get_workspace_file_content(workspaces_base_dir, file_id).await?;
                    parts.push(content);
                }
            }
            _ => {} // skip unknown block types
        }
    }

    Ok(parts.join("\n\n"))
}
