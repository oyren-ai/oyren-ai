use crate::adapters::db::models::WorkspacePrompt;
use sqlx::SqlitePool;

pub async fn list_workspace_prompts_by_workspace(
    pool: &SqlitePool,
    workspace_id: &str,
) -> Result<Vec<WorkspacePrompt>, String> {
    sqlx::query_as::<_, WorkspacePrompt>(
        r#"
        SELECT id, workspace_id, title, blocks, created_at, updated_at
        FROM workspace_prompts
        WHERE workspace_id = ?
        ORDER BY updated_at DESC
        "#,
    )
    .bind(workspace_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list workspace prompts: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::repositories::workspace_prompts::create::create_workspace_prompt;
    use crate::adapters::db::test_utils::setup_test_db;

    #[tokio::test]
    async fn test_list_prompts_empty() {
        let (pool, _dir) = setup_test_db().await;
        let result = list_workspace_prompts_by_workspace(&pool, "ws-1").await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_list_prompts_returns_matching() {
        let (pool, _dir) = setup_test_db().await;
        create_test_workspace(&pool).await;

        create_workspace_prompt(&pool, "ws-1".into(), "A".into(), "[]".into()).await.unwrap();
        create_workspace_prompt(&pool, "ws-1".into(), "B".into(), "[]".into()).await.unwrap();

        let result = list_workspace_prompts_by_workspace(&pool, "ws-1").await.unwrap();
        assert_eq!(result.len(), 2);
    }

    async fn create_test_workspace(pool: &SqlitePool) {
        sqlx::query("INSERT INTO workspaces (id, name) VALUES ('ws-1', 'Test')")
            .execute(pool).await.unwrap();
    }
}
