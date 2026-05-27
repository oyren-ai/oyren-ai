use crate::adapters::db::repositories::workspace_prompts;
use crate::adapters::db::sqlite;
use crate::services::workspace_prompt_service::types::validate_blocks_json;

pub async fn update_prompt(
    prompt_id: String,
    title: String,
    blocks: String,
) -> Result<(), String> {
    if title.trim().is_empty() {
        return Err("Prompt title cannot be empty".to_string());
    }
    validate_blocks_json(&blocks)?;

    let pool = sqlite::get_db_pool()?;
    workspace_prompts::update_workspace_prompt(pool, &prompt_id, title, blocks).await
}
