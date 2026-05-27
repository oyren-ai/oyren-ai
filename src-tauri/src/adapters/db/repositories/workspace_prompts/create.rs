use crate::adapters::db::models::WorkspacePrompt;
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn create_workspace_prompt(
    pool: &SqlitePool,
    workspace_id: String,
    title: String,
    blocks: String,
) -> Result<WorkspacePrompt, String> {
    let now = Utc::now();
    let id = Uuid::new_v4().to_string();

    let prompt = WorkspacePrompt {
        id: id.clone(),
        workspace_id,
        title,
        blocks,
        created_at: now,
        updated_at: now,
    };

    sqlx::query(
        r#"
        INSERT INTO workspace_prompts (id, workspace_id, title, blocks, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&prompt.id)
    .bind(&prompt.workspace_id)
    .bind(&prompt.title)
    .bind(&prompt.blocks)
    .bind(&prompt.created_at)
    .bind(&prompt.updated_at)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create workspace prompt: {}", e))?;

    Ok(prompt)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::setup_test_db;

    #[tokio::test]
    async fn test_create_workspace_prompt_success() {
        let (pool, _dir) = setup_test_db().await;
        create_test_workspace(&pool).await;

        let result = create_workspace_prompt(
            &pool,
            "ws-1".to_string(),
            "My Prompt".to_string(),
            "[]".to_string(),
        )
        .await;

        assert!(result.is_ok());
        let prompt = result.unwrap();
        assert_eq!(prompt.title, "My Prompt");
        assert_eq!(prompt.blocks, "[]");
        assert_eq!(prompt.workspace_id, "ws-1");
    }

    async fn create_test_workspace(pool: &SqlitePool) {
        sqlx::query("INSERT INTO workspaces (id, name) VALUES ('ws-1', 'Test')")
            .execute(pool)
            .await
            .unwrap();
    }
}
