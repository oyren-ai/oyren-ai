use chrono::Utc;
use sqlx::SqlitePool;

pub async fn update_workspace_prompt(
    pool: &SqlitePool,
    prompt_id: &str,
    title: String,
    blocks: String,
) -> Result<(), String> {
    let now = Utc::now();

    let result = sqlx::query(
        "UPDATE workspace_prompts SET title = ?, blocks = ?, updated_at = ? WHERE id = ?",
    )
    .bind(&title)
    .bind(&blocks)
    .bind(&now)
    .bind(prompt_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update workspace prompt: {}", e))?;

    match result.rows_affected() {
        0 => Err(format!("Workspace prompt not found: {}", prompt_id)),
        _ => Ok(()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::repositories::workspace_prompts::create::create_workspace_prompt;
    use crate::adapters::db::repositories::workspace_prompts::get_by_id::get_workspace_prompt_by_id;
    use crate::adapters::db::test_utils::setup_test_db;

    #[tokio::test]
    async fn test_update_prompt_success() {
        let (pool, _dir) = setup_test_db().await;
        create_test_workspace(&pool).await;

        let created = create_workspace_prompt(
            &pool, "ws-1".into(), "Old".into(), "[]".into(),
        ).await.unwrap();

        let result = update_workspace_prompt(&pool, &created.id, "New".into(), "[{}]".into()).await;
        assert!(result.is_ok());

        let updated = get_workspace_prompt_by_id(&pool, &created.id).await.unwrap();
        assert_eq!(updated.title, "New");
        assert_eq!(updated.blocks, "[{}]");
    }

    #[tokio::test]
    async fn test_update_prompt_not_found() {
        let (pool, _dir) = setup_test_db().await;
        let result = update_workspace_prompt(&pool, "nope", "T".into(), "[]".into()).await;
        assert!(result.is_err());
    }

    async fn create_test_workspace(pool: &sqlx::SqlitePool) {
        sqlx::query("INSERT INTO workspaces (id, name) VALUES ('ws-1', 'Test')")
            .execute(pool).await.unwrap();
    }
}
