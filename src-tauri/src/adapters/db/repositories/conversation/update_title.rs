use sqlx::SqlitePool;

pub async fn update_conversation_title(
    pool: &SqlitePool,
    id: &str,
    new_title: &str,
) -> Result<(), String> {
    sqlx::query(
        "UPDATE ai_agent_conversations
         SET title = ?
         WHERE id = ? AND is_active = 1",
    )
    .bind(new_title)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update conversation title: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use sqlx::{Row, SqlitePool};
    use tempfile::TempDir;

    async fn create_test_conversation(pool: &SqlitePool, id: &str, title: &str, is_active: bool) {
        let now = Utc::now();

        // Create workspace first
        sqlx::query(
            "INSERT INTO workspaces (id, name, created_at, updated_at, last_accessed_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind("workspace-1")
        .bind("Test Workspace")
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .bind(true)
        .execute(pool)
        .await
        .ok(); // Ignore error if workspace already exists

        sqlx::query(
            "INSERT INTO ai_agent_conversations
             (id, workspace_id, title, provider, model, created_at, updated_at, last_accessed_at, is_pinned, is_archived, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind("workspace-1")
        .bind(title)
        .bind("gemini")
        .bind("gemini-2.5-flash")
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .bind(false)
        .bind(false)
        .bind(is_active)
        .execute(pool)
        .await
        .expect("Failed to create test conversation");
    }

    #[tokio::test]
    async fn test_update_title_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-title-1";

        create_test_conversation(&pool, conversation_id, "Original Title", true).await;

        let result = update_conversation_title(&pool, conversation_id, "New Title").await;
        assert!(result.is_ok());

        // Verify title updated
        let row = sqlx::query("SELECT title FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let title: String = row.get("title");
        assert_eq!(title, "New Title");
    }

    #[tokio::test]
    async fn test_update_title_empty_string() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-title-2";

        create_test_conversation(&pool, conversation_id, "Original Title", true).await;

        let result = update_conversation_title(&pool, conversation_id, "").await;
        assert!(result.is_ok());

        // Verify title updated to empty
        let row = sqlx::query("SELECT title FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let title: String = row.get("title");
        assert_eq!(title, "");
    }

    #[tokio::test]
    async fn test_update_title_nonexistent_conversation() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;

        let result = update_conversation_title(&pool, "nonexistent-id", "New Title").await;
        // Should succeed (idempotent operation)
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_update_title_inactive_conversation() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-title-inactive";

        create_test_conversation(&pool, conversation_id, "Original Title", false).await;

        let result = update_conversation_title(&pool, conversation_id, "New Title").await;
        assert!(result.is_ok());

        // Verify NOT updated (should not update inactive conversations)
        let row = sqlx::query("SELECT title FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let title: String = row.get("title");
        assert_eq!(title, "Original Title");
    }

    #[tokio::test]
    async fn test_update_title_with_special_characters() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-title-special";

        create_test_conversation(&pool, conversation_id, "Original", true).await;

        let new_title = "Title with 'quotes' and \"double quotes\" & symbols!";
        let result = update_conversation_title(&pool, conversation_id, new_title).await;
        assert!(result.is_ok());

        // Verify title updated
        let row = sqlx::query("SELECT title FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let title: String = row.get("title");
        assert_eq!(title, new_title);
    }
}
