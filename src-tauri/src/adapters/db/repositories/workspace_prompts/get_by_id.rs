use crate::adapters::db::models::WorkspacePrompt;
use sqlx::SqlitePool;

pub async fn get_workspace_prompt_by_id(
    pool: &SqlitePool,
    prompt_id: &str,
) -> Result<WorkspacePrompt, String> {
    sqlx::query_as::<_, WorkspacePrompt>(
        "SELECT id, workspace_id, title, blocks, created_at, updated_at FROM workspace_prompts WHERE id = ?",
    )
    .bind(prompt_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to get workspace prompt: {}", e))?
    .ok_or_else(|| format!("Workspace prompt not found: {}", prompt_id))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::repositories::workspace_prompts::create::create_workspace_prompt;
    use crate::adapters::db::test_utils::setup_test_db;

    #[tokio::test]
    async fn test_get_prompt_by_id_success() {
        let (pool, _dir) = setup_test_db().await;
        create_test_workspace(&pool).await;

        let created = create_workspace_prompt(
            &pool, "ws-1".into(), "Test".into(), "[]".into(),
        ).await.unwrap();

        let result = get_workspace_prompt_by_id(&pool, &created.id).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().title, "Test");
    }

    #[tokio::test]
    async fn test_get_prompt_by_id_not_found() {
        let (pool, _dir) = setup_test_db().await;
        let result = get_workspace_prompt_by_id(&pool, "nonexistent").await;
        assert!(result.is_err());
    }

    async fn create_test_workspace(pool: &SqlitePool) {
        sqlx::query("INSERT INTO workspaces (id, name) VALUES ('ws-1', 'Test')")
            .execute(pool).await.unwrap();
    }
}
