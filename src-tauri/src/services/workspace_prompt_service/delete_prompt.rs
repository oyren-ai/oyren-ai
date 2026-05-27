use crate::adapters::db::repositories::workspace_prompts;
use crate::adapters::db::sqlite;

pub async fn delete_prompt(prompt_id: String) -> Result<(), String> {
    let pool = sqlite::get_db_pool()?;
    workspace_prompts::delete_workspace_prompt(pool, &prompt_id).await
}
