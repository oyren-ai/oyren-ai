use crate::adapters::db::{repositories, sqlite};

pub async fn pin_conversation(conversation_id: String, pin: bool) -> Result<(), String> {
    let pool = sqlite::get_db_pool()?;
    repositories::conversation::toggle_pin_conversation(pool, &conversation_id, pin).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use sqlx::{Row, SqlitePool};

    async fn setup_test_conversation(pool: &SqlitePool, conversation_id: &str) {
        let now = Utc::now();

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
        .ok();

        sqlx::query(
            "INSERT INTO ai_agent_conversations
             (id, workspace_id, title, provider, model, created_at, updated_at, last_accessed_at, is_pinned, is_archived, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(conversation_id)
        .bind("workspace-1")
        .bind("Test Conversation")
        .bind("gemini")
        .bind("gemini-2.5-flash")
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .bind(false)
        .bind(false)
        .bind(true)
        .execute(pool)
        .await
        .expect("Failed to create conversation");
    }

    #[tokio::test]
    async fn test_pin_conversation_to_true() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-pin-1";

        setup_test_conversation(&pool, conversation_id).await;

        let result = repositories::conversation::toggle_pin_conversation(&pool, conversation_id, true).await;
        assert!(result.is_ok());

        let row = sqlx::query("SELECT is_pinned FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let is_pinned: bool = row.get("is_pinned");
        assert!(is_pinned);
    }

    #[tokio::test]
    async fn test_pin_conversation_to_false() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-pin-2";

        setup_test_conversation(&pool, conversation_id).await;

        repositories::conversation::toggle_pin_conversation(&pool, conversation_id, true).await.unwrap();

        let result = repositories::conversation::toggle_pin_conversation(&pool, conversation_id, false).await;
        assert!(result.is_ok());

        let row = sqlx::query("SELECT is_pinned FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let is_pinned: bool = row.get("is_pinned");
        assert!(!is_pinned);
    }

    #[tokio::test]
    async fn test_pin_conversation_nonexistent() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;

        let result = repositories::conversation::toggle_pin_conversation(&pool, "nonexistent-conv", true).await;
        assert!(result.is_ok());
    }
}