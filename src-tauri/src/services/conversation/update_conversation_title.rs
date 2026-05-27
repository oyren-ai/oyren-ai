use crate::adapters::db::{repositories, sqlite};

pub async fn update_conversation_title(
    conversation_id: String,
    new_title: String,
) -> Result<(), String> {
    let pool = sqlite::get_db_pool()?;
    repositories::conversation::update_conversation_title(pool, &conversation_id, &new_title).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use sqlx::{Row, SqlitePool};

    async fn setup_test_conversation(pool: &SqlitePool, conversation_id: &str, title: &str) {
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
        .bind(title)
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
    async fn test_update_title_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-title-1";

        setup_test_conversation(&pool, conversation_id, "Original Title").await;

        let result = repositories::conversation::update_conversation_title(&pool, conversation_id, "New Title").await;
        assert!(result.is_ok());

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

        setup_test_conversation(&pool, conversation_id, "Original Title").await;

        let result = repositories::conversation::update_conversation_title(&pool, conversation_id, "").await;
        assert!(result.is_ok());

        let row = sqlx::query("SELECT title FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let title: String = row.get("title");
        assert_eq!(title, "");
    }

    #[tokio::test]
    async fn test_update_title_with_special_characters() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-title-special";

        setup_test_conversation(&pool, conversation_id, "Original").await;

        let new_title = "Title with 'quotes' and \"double quotes\" & symbols!";
        let result = repositories::conversation::update_conversation_title(&pool, conversation_id, new_title).await;
        assert!(result.is_ok());

        let row = sqlx::query("SELECT title FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");

        let title: String = row.get("title");
        assert_eq!(title, new_title);
    }
}