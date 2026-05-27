use crate::adapters::db::models::WorkspacePrompt;
use crate::adapters::db::repositories::workspace_prompts;
use crate::adapters::db::sqlite;

pub async fn list_prompts(workspace_id: String) -> Result<Vec<WorkspacePrompt>, String> {
    let pool = sqlite::get_db_pool()?;
    workspace_prompts::list_workspace_prompts_by_workspace(pool, &workspace_id).await
}
