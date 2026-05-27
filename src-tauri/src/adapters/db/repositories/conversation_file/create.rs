use crate::adapters::db::models::conversation_file::{
    ConversationFile, ConversationFileMetadata, CreateConversationFileRequest,
};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use super::find_by_message_and_file;

pub async fn create_conversation_file(
    pool: &SqlitePool,
    request: CreateConversationFileRequest,
) -> Result<ConversationFile, String> {
    // Return existing record if this file is already attached to this message
    //TODO: extract this and refactor to a separate method
    if let Some(ws_file_id) = &request.workspace_file_id {
        if let Some(existing) =
            find_by_message_and_file(pool, &request.conversation_message_id, ws_file_id).await?
        {
            return Ok(existing);
        }
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    let metadata = ConversationFileMetadata {
        filename: request.filename,
    };

    let metadata_json = serde_json::to_string(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;

    let file = ConversationFile {
        id: id.clone(),
        workspace_file_id: request.workspace_file_id,
        conversation_id: request.conversation_id,
        conversation_message_id: request.conversation_message_id,
        metadata: metadata_json.clone(),
        is_attachment: request.is_attachment,
        created_at: now,
    };

    sqlx::query(
        "INSERT INTO ai_agent_conversation_files
         (id, workspace_file_id, conversation_id, conversation_message_id, metadata, is_attachment, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&file.id)
    .bind(&file.workspace_file_id)
    .bind(&file.conversation_id)
    .bind(&file.conversation_message_id)
    .bind(&metadata_json)
    .bind(file.is_attachment)
    .bind(&file.created_at)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create conversation file: {}", e))?;

    Ok(file)
}
