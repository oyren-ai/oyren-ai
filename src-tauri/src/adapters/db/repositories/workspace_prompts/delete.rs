use sqlx::SqlitePool;

pub async fn delete_workspace_prompt(
    pool: &SqlitePool,
    prompt_id: &str,
) -> Result<(), String> {
    let result = sqlx::query("DELETE FROM workspace_prompts WHERE id = ?")
        .bind(prompt_id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete workspace prompt: {}", e))?;

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
    async fn test_delete_prompt_success() {
        let (pool, _dir) = setup_test_db().await;
        create_test_workspace(&pool).await;

        let created = create_workspace_prompt(
            &pool, "ws-1".into(), "To Delete".into(), "[]".into(),
        ).await.unwrap();

        let result = delete_workspace_prompt(&pool, &created.id).await;
        assert!(result.is_ok());

        let get_result = get_workspace_prompt_by_id(&pool, &created.id).await;
        assert!(get_result.is_err());
    }

    #[tokio::test]
    async fn test_delete_prompt_not_found() {
        let (pool, _dir) = setup_test_db().await;
        let result = delete_workspace_prompt(&pool, "nonexistent").await;
        assert!(result.is_err());
    }

    async fn create_test_workspace(pool: &sqlx::SqlitePool) {
        sqlx::query("INSERT INTO workspaces (id, name) VALUES ('ws-1', 'Test')")
            .execute(pool).await.unwrap();
    }
}
