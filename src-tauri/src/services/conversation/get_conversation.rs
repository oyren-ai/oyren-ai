use crate::adapters::db::{
    models::workspace_chats::ConversationWithMessages, repositories, sqlite,
};

pub async fn get_conversation_with_messages(
    conversation_id: String,
) -> Result<ConversationWithMessages, String> {
    let pool = sqlite::get_db_pool()?;

    let conversation =
        repositories::conversation::get_conversation_by_id(pool, &conversation_id).await?;
    let messages =
        repositories::conversation_message::list_messages_by_conversation(pool, &conversation_id)
            .await?;

    repositories::conversation::update_conversation_last_accessed(pool, &conversation_id).await?;

    Ok(ConversationWithMessages {
        conversation,
        messages,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::workspace_chats::CreateMessageRequest;
    use chrono::Utc;
    use sqlx::SqlitePool;

    async fn setup_test_conversation_with_messages(
        pool: &SqlitePool,
        conversation_id: &str,
    ) {
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
    async fn test_get_conversation_with_messages_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-get-1";

        setup_test_conversation_with_messages(&pool, conversation_id).await;

        // Add some messages
        let request1 = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "Hello".to_string(),
            images: None,
            provider: None,
            model: None,
            input_tokens: None,
            output_tokens: None,
        };
        repositories::conversation_message::create_message(&pool, request1).await.unwrap();

        let request2 = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "assistant".to_string(),
            content: "Hi there!".to_string(),
            images: None,
            provider: Some("gemini".to_string()),
            model: Some("gemini-2.5-flash".to_string()),
            input_tokens: None,
            output_tokens: Some(5),
        };
        repositories::conversation_message::create_message(&pool, request2).await.unwrap();

        // Get conversation with messages
        let conversation = repositories::conversation::get_conversation_by_id(&pool, conversation_id).await.unwrap();
        let messages = repositories::conversation_message::list_messages_by_conversation(&pool, conversation_id).await.unwrap();

        assert_eq!(conversation.id, conversation_id);
        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0].role, "user");
        assert_eq!(messages[1].role, "assistant");
    }

    #[tokio::test]
    async fn test_get_conversation_empty_messages() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-get-empty";

        setup_test_conversation_with_messages(&pool, conversation_id).await;

        let conversation = repositories::conversation::get_conversation_by_id(&pool, conversation_id).await.unwrap();
        let messages = repositories::conversation_message::list_messages_by_conversation(&pool, conversation_id).await.unwrap();

        assert_eq!(conversation.id, conversation_id);
        assert_eq!(messages.len(), 0);
    }

    #[tokio::test]
    async fn test_get_conversation_not_found() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;

        let result = repositories::conversation::get_conversation_by_id(&pool, "nonexistent").await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_conversation_updates_last_accessed() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-get-access";

        setup_test_conversation_with_messages(&pool, conversation_id).await;

        // Wait a bit
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        let before = Utc::now();
        repositories::conversation::update_conversation_last_accessed(&pool, conversation_id).await.unwrap();

        let conversation = repositories::conversation::get_conversation_by_id(&pool, conversation_id).await.unwrap();

        assert!(conversation.last_accessed_at >= before);
    }
}