use crate::adapters::db::models::workspace_chats::{ConversationMessage, CreateMessageRequest};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use super::get_latest_sequence_number;

pub async fn create_message(
    pool: &SqlitePool,
    request: CreateMessageRequest,
) -> Result<ConversationMessage, String> {
    let latest_seq = get_latest_sequence_number(pool, &request.conversation_id).await?;
    let sequence_number = latest_seq + 1;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    let images_json = request
        .images
        .as_ref()
        .map(|imgs| serde_json::to_string(imgs).unwrap());

    let message = ConversationMessage {
        id: id.clone(),
        conversation_id: request.conversation_id.clone(),
        role: request.role,
        content: request.content,
        images: images_json.clone(),
        created_at: now,
        sequence_number,
        provider: request.provider.clone(),
        model: request.model.clone(),
        input_tokens: request.input_tokens,
        output_tokens: request.output_tokens,
        attached_files: None,
    };

    sqlx::query(
        "INSERT INTO ai_agent_conversation_messages
         (id, conversation_id, role, content, images, created_at, sequence_number,
          provider, model, input_tokens, output_tokens)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&message.id)
    .bind(&message.conversation_id)
    .bind(&message.role)
    .bind(&message.content)
    .bind(&message.images)
    .bind(&message.created_at)
    .bind(message.sequence_number)
    .bind(&message.provider)
    .bind(&message.model)
    .bind(message.input_tokens)
    .bind(message.output_tokens)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create message: {}", e))?;

    sqlx::query(
        "UPDATE ai_agent_conversations
         SET updated_at = ?
         WHERE id = ?",
    )
    .bind(now)
    .bind(&message.conversation_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update conversation timestamp: {}", e))?;

    Ok(message)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::workspace_chats::ImageData;
    use chrono::Utc;
    use sqlx::{Row, SqlitePool};
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

    #[tokio::test]
    async fn test_create_message_success() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-msg-1";

        create_test_conversation(&pool, conversation_id).await;

        let request = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "Hello, world!".to_string(),
            images: None,
            provider: Some("gemini".to_string()),
            model: Some("gemini-2.5-flash".to_string()),
            input_tokens: Some(10),
            output_tokens: Some(20),
        };

        let result = create_message(&pool, request).await;
        assert!(result.is_ok());

        let message = result.unwrap();
        assert_eq!(message.conversation_id, conversation_id);
        assert_eq!(message.role, "user");
        assert_eq!(message.content, "Hello, world!");
        assert_eq!(message.sequence_number, 0);
        assert_eq!(message.provider, Some("gemini".to_string()));
        assert_eq!(message.model, Some("gemini-2.5-flash".to_string()));
        assert_eq!(message.input_tokens, Some(10));
        assert_eq!(message.output_tokens, Some(20));
    }

    #[tokio::test]
    async fn test_create_message_with_images() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-msg-images";

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

        let request = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "Check these images".to_string(),
            images: Some(images.clone()),
            provider: None,
            model: None,
            input_tokens: None,
            output_tokens: None,
        };

        let result = create_message(&pool, request).await;
        assert!(result.is_ok());

        let message = result.unwrap();
        assert!(message.images.is_some());

        // Verify images were serialized correctly
        let images_json = message.images.unwrap();
        let deserialized: Vec<ImageData> = serde_json::from_str(&images_json).unwrap();
        assert_eq!(deserialized.len(), 2);
        assert_eq!(deserialized[0].data, "base64data1");
        assert_eq!(deserialized[1].mime_type, "image/jpeg");
    }

    #[tokio::test]
    async fn test_create_message_sequence_increments() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-msg-seq";

        create_test_conversation(&pool, conversation_id).await;

        // Create first message
        let request1 = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "First message".to_string(),
            images: None,
            provider: None,
            model: None,
            input_tokens: None,
            output_tokens: None,
        };
        let msg1 = create_message(&pool, request1).await.unwrap();
        assert_eq!(msg1.sequence_number, 0);

        // Create second message
        let request2 = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "assistant".to_string(),
            content: "Second message".to_string(),
            images: None,
            provider: None,
            model: None,
            input_tokens: None,
            output_tokens: None,
        };
        let msg2 = create_message(&pool, request2).await.unwrap();
        assert_eq!(msg2.sequence_number, 1);

        // Create third message
        let request3 = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "Third message".to_string(),
            images: None,
            provider: None,
            model: None,
            input_tokens: None,
            output_tokens: None,
        };
        let msg3 = create_message(&pool, request3).await.unwrap();
        assert_eq!(msg3.sequence_number, 2);
    }

    #[tokio::test]
    async fn test_create_message_updates_conversation_timestamp() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-msg-timestamp";

        create_test_conversation(&pool, conversation_id).await;

        // Get original updated_at
        let original_row = sqlx::query("SELECT updated_at FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");
        let original_time: chrono::DateTime<Utc> = original_row.get("updated_at");

        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        let request = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "user".to_string(),
            content: "Test".to_string(),
            images: None,
            provider: None,
            model: None,
            input_tokens: None,
            output_tokens: None,
        };

        create_message(&pool, request).await.unwrap();

        // Verify timestamp updated
        let row = sqlx::query("SELECT updated_at FROM ai_agent_conversations WHERE id = ?")
            .bind(conversation_id)
            .fetch_one(&pool)
            .await
            .expect("Failed to query conversation");
        let updated_time: chrono::DateTime<Utc> = row.get("updated_at");

        assert!(updated_time > original_time);
    }

    #[tokio::test]
    async fn test_create_message_nonexistent_conversation() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;

        let request = CreateMessageRequest {
            conversation_id: "nonexistent-conv".to_string(),
            role: "user".to_string(),
            content: "Test".to_string(),
            images: None,
            provider: None,
            model: None,
            input_tokens: None,
            output_tokens: None,
        };

        let result = create_message(&pool, request).await;
        // Should fail because conversation doesn't exist (no foreign key constraint in test, but conversation update will fail)
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_message_preserves_all_fields() {
        let (pool, _temp_dir) = crate::adapters::db::test_utils::setup_test_db().await;
        let conversation_id = "conv-msg-fields";

        create_test_conversation(&pool, conversation_id).await;

        let request = CreateMessageRequest {
            conversation_id: conversation_id.to_string(),
            role: "assistant".to_string(),
            content: "Detailed response".to_string(),
            images: None,
            provider: Some("deepseek".to_string()),
            model: Some("deepseek-chat".to_string()),
            input_tokens: Some(100),
            output_tokens: Some(200),
        };

        let message = create_message(&pool, request).await.unwrap();

        // Verify all fields are preserved in database
        let row = sqlx::query(
            "SELECT role, content, provider, model, input_tokens, output_tokens
             FROM ai_agent_conversation_messages WHERE id = ?",
        )
        .bind(&message.id)
        .fetch_one(&pool)
        .await
        .expect("Failed to query message");

        assert_eq!(row.get::<String, _>("role"), "assistant");
        assert_eq!(row.get::<String, _>("content"), "Detailed response");
        assert_eq!(row.get::<Option<String>, _>("provider"), Some("deepseek".to_string()));
        assert_eq!(row.get::<Option<String>, _>("model"), Some("deepseek-chat".to_string()));
        assert_eq!(row.get::<Option<i32>, _>("input_tokens"), Some(100));
        assert_eq!(row.get::<Option<i32>, _>("output_tokens"), Some(200));
    }
}
