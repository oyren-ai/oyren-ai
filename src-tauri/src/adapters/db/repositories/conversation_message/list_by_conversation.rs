use crate::adapters::db::models::workspace_chats::ConversationMessage;
use crate::adapters::db::repositories::conversation_file;
use sqlx::{Row, SqlitePool};

pub async fn list_messages_by_conversation(
    pool: &SqlitePool,
    conversation_id: &str,
) -> Result<Vec<ConversationMessage>, String> {
    let rows = sqlx::query(
        "SELECT id, conversation_id, role, content, images,
                created_at, sequence_number, provider, model,
                input_tokens, output_tokens
         FROM ai_agent_conversation_messages
         WHERE conversation_id = ?
         ORDER BY sequence_number ASC",
    )
    .bind(conversation_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list messages: {}", e))?;

    let mut messages: Vec<ConversationMessage> = rows
        .iter()
        .map(|row| ConversationMessage {
            id: row.get("id"),
            conversation_id: row.get("conversation_id"),
            role: row.get("role"),
            content: row.get("content"),
            images: row.get("images"),
            created_at: row.get("created_at"),
            sequence_number: row.get("sequence_number"),
            provider: row.get("provider"),
            model: row.get("model"),
            input_tokens: row.get("input_tokens"),
            output_tokens: row.get("output_tokens"),
            attached_files: None,
        })
        .collect();

    // Fetch attached files for each message
    for message in &mut messages {
        let files = conversation_file::list_files_by_message(pool, &message.id).await?;
        message.attached_files = if files.is_empty() { None } else { Some(files) };
    }

    Ok(messages)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::workspace_chats::ImageData;
    use chrono::Utc;
    use sqlx::SqlitePool;
    use tempfile::TempDir;

    async fn create_test_conversation(pool: &SqlitePool, id: &str) {
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
        .expect("Failed to create test conversation");
    }

    async fn create_test_message(
        pool: &SqlitePool,
        id: &str,
        conversation_id: &str,
        role: &str,
        content: &str,
        sequence_number: i32,
        images: Option<String>,
        provider: Option<String>,
        model: Option<String>,
        input_tokens: Option<i32>,
        output_tokens: Option<i32>,
    ) {
        let now = Utc::now();

        sqlx::query(
            "INSERT INTO ai_agent_conversation_messages
             (id, conversation_id, role, content, images, created_at, sequence_number, provider, model, input_tokens, output_tokens)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind(conversation_id)
        .bind(role)
        .bind(content)
        .bind(&images)
        .bind(&now)
        .bind(sequence_number)
        .bind(&provider)
        .bind(&model)
        .bind(input_tokens)
        .bind(output_tokens)
        .execute(pool)
        .await
        .expect("Failed to create test message");
    }

    #[tokio::test]
    async fn test_list_messages_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-list-1";

        create_test_conversation(&pool, conversation_id).await;

        // Create multiple messages
        create_test_message(
            &pool,
            "msg-1",
            conversation_id,
            "user",
            "First message",
            0,
            None,
            None,
            None,
            None,
            None,
        )
        .await;

        create_test_message(
            &pool,
            "msg-2",
            conversation_id,
            "assistant",
            "Second message",
            1,
            None,
            Some("gemini".to_string()),
            Some("gemini-2.5-flash".to_string()),
            Some(10),
            Some(20),
        )
        .await;

        create_test_message(
            &pool,
            "msg-3",
            conversation_id,
            "user",
            "Third message",
            2,
            None,
            None,
            None,
            None,
            None,
        )
        .await;

        let result = list_messages_by_conversation(&pool, conversation_id).await;
        assert!(result.is_ok());

        let messages = result.unwrap();
        assert_eq!(messages.len(), 3);

        // Verify order
        assert_eq!(messages[0].id, "msg-1");
        assert_eq!(messages[1].id, "msg-2");
        assert_eq!(messages[2].id, "msg-3");

        // Verify content
        assert_eq!(messages[0].role, "user");
        assert_eq!(messages[0].content, "First message");
        assert_eq!(messages[0].sequence_number, 0);

        assert_eq!(messages[1].role, "assistant");
        assert_eq!(messages[1].content, "Second message");
        assert_eq!(messages[1].sequence_number, 1);
        assert_eq!(messages[1].provider, Some("gemini".to_string()));
        assert_eq!(messages[1].model, Some("gemini-2.5-flash".to_string()));
        assert_eq!(messages[1].input_tokens, Some(10));
        assert_eq!(messages[1].output_tokens, Some(20));
    }

    #[tokio::test]
    async fn test_list_messages_empty_conversation() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-list-empty";

        create_test_conversation(&pool, conversation_id).await;

        let result = list_messages_by_conversation(&pool, conversation_id).await;
        assert!(result.is_ok());

        let messages = result.unwrap();
        assert_eq!(messages.len(), 0);
    }

    #[tokio::test]
    async fn test_list_messages_nonexistent_conversation() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;

        let result = list_messages_by_conversation(&pool, "nonexistent-conv").await;
        assert!(result.is_ok());

        let messages = result.unwrap();
        assert_eq!(messages.len(), 0);
    }

    #[tokio::test]
    async fn test_list_messages_ordering() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-list-order";

        create_test_conversation(&pool, conversation_id).await;

        // Create messages in non-sequential order
        create_test_message(
            &pool,
            "msg-3",
            conversation_id,
            "user",
            "Third",
            2,
            None,
            None,
            None,
            None,
            None,
        )
        .await;

        create_test_message(
            &pool,
            "msg-1",
            conversation_id,
            "user",
            "First",
            0,
            None,
            None,
            None,
            None,
            None,
        )
        .await;

        create_test_message(
            &pool,
            "msg-2",
            conversation_id,
            "assistant",
            "Second",
            1,
            None,
            None,
            None,
            None,
            None,
        )
        .await;

        let result = list_messages_by_conversation(&pool, conversation_id).await;
        assert!(result.is_ok());

        let messages = result.unwrap();
        assert_eq!(messages.len(), 3);

        // Verify ordering by sequence_number (not insertion order)
        assert_eq!(messages[0].sequence_number, 0);
        assert_eq!(messages[0].content, "First");

        assert_eq!(messages[1].sequence_number, 1);
        assert_eq!(messages[1].content, "Second");

        assert_eq!(messages[2].sequence_number, 2);
        assert_eq!(messages[2].content, "Third");
    }

    #[tokio::test]
    async fn test_list_messages_with_images() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-list-images";

        create_test_conversation(&pool, conversation_id).await;

        let images = vec![
            ImageData {
                data: "base64data1".to_string(),
                mime_type: "image/png".to_string(),
            },
            ImageData {
                data: "base64data2".to_string(),
                mime_type: "image/jpeg".to_string(),
            },
        ];
        let images_json = serde_json::to_string(&images).unwrap();

        create_test_message(
            &pool,
            "msg-images",
            conversation_id,
            "user",
            "Message with images",
            0,
            Some(images_json),
            None,
            None,
            None,
            None,
        )
        .await;

        let result = list_messages_by_conversation(&pool, conversation_id).await;
        assert!(result.is_ok());

        let messages = result.unwrap();
        assert_eq!(messages.len(), 1);
        assert!(messages[0].images.is_some());

        // Verify images can be deserialized
        let images_json = messages[0].images.as_ref().unwrap();
        let deserialized: Vec<ImageData> = serde_json::from_str(images_json).unwrap();
        assert_eq!(deserialized.len(), 2);
        assert_eq!(deserialized[0].data, "base64data1");
        assert_eq!(deserialized[1].mime_type, "image/jpeg");
    }

    #[tokio::test]
    async fn test_list_messages_multiple_conversations() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id_1 = "conv-list-multi-1";
        let conversation_id_2 = "conv-list-multi-2";

        create_test_conversation(&pool, conversation_id_1).await;
        create_test_conversation(&pool, conversation_id_2).await;

        // Add messages to conversation 1
        create_test_message(
            &pool,
            "msg-1-1",
            conversation_id_1,
            "user",
            "Conv1 Msg1",
            0,
            None,
            None,
            None,
            None,
            None,
        )
        .await;

        create_test_message(
            &pool,
            "msg-1-2",
            conversation_id_1,
            "assistant",
            "Conv1 Msg2",
            1,
            None,
            None,
            None,
            None,
            None,
        )
        .await;

        // Add messages to conversation 2
        create_test_message(
            &pool,
            "msg-2-1",
            conversation_id_2,
            "user",
            "Conv2 Msg1",
            0,
            None,
            None,
            None,
            None,
            None,
        )
        .await;

        // Verify conversation 1 has only its messages
        let result1 = list_messages_by_conversation(&pool, conversation_id_1).await;
        assert!(result1.is_ok());
        let messages1 = result1.unwrap();
        assert_eq!(messages1.len(), 2);
        assert_eq!(messages1[0].content, "Conv1 Msg1");
        assert_eq!(messages1[1].content, "Conv1 Msg2");

        // Verify conversation 2 has only its messages
        let result2 = list_messages_by_conversation(&pool, conversation_id_2).await;
        assert!(result2.is_ok());
        let messages2 = result2.unwrap();
        assert_eq!(messages2.len(), 1);
        assert_eq!(messages2[0].content, "Conv2 Msg1");
    }

    #[tokio::test]
    async fn test_list_messages_preserves_all_fields() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-list-fields";

        create_test_conversation(&pool, conversation_id).await;

        create_test_message(
            &pool,
            "msg-fields",
            conversation_id,
            "assistant",
            "Detailed response",
            0,
            None,
            Some("deepseek".to_string()),
            Some("deepseek-chat".to_string()),
            Some(100),
            Some(200),
        )
        .await;

        let result = list_messages_by_conversation(&pool, conversation_id).await;
        assert!(result.is_ok());

        let messages = result.unwrap();
        assert_eq!(messages.len(), 1);

        let message = &messages[0];
        assert_eq!(message.id, "msg-fields");
        assert_eq!(message.conversation_id, conversation_id);
        assert_eq!(message.role, "assistant");
        assert_eq!(message.content, "Detailed response");
        assert_eq!(message.sequence_number, 0);
        assert_eq!(message.provider, Some("deepseek".to_string()));
        assert_eq!(message.model, Some("deepseek-chat".to_string()));
        assert_eq!(message.input_tokens, Some(100));
        assert_eq!(message.output_tokens, Some(200));
        assert!(message.images.is_none());
    }
}
