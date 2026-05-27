use crate::adapters::db::models::conversation_file::ConversationFile;
use chrono::{DateTime, Utc};
use sqlx::{Row, SqlitePool};

pub async fn list_files_by_message(
    pool: &SqlitePool,
    message_id: &str,
) -> Result<Vec<ConversationFile>, String> {
    let rows = sqlx::query(
        "SELECT id, workspace_file_id, conversation_id, conversation_message_id, metadata, is_attachment, created_at
         FROM ai_agent_conversation_files
         WHERE conversation_message_id = ?
         ORDER BY created_at",
    )
    .bind(message_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list conversation files: {}", e))?;

    let files = rows
        .iter()
        .map(|row| ConversationFile {
            id: row.get("id"),
            workspace_file_id: row.get("workspace_file_id"),
            conversation_id: row.get("conversation_id"),
            conversation_message_id: row.get("conversation_message_id"),
            metadata: row.get("metadata"),
            is_attachment: row.get("is_attachment"),
            created_at: row.get::<DateTime<Utc>, _>("created_at"),
        })
        .collect();

    Ok(files)
}
