use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Conversation file attachment record
/// Tracks which workspace files were attached to messages
/// Does NOT store file content, only references and metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationFile {
    pub id: String,
    pub workspace_file_id: Option<String>,
    pub conversation_id: String,
    pub conversation_message_id: String,
    pub metadata: String, // JSON string: {"filename": "document.pdf"}
    pub is_attachment: bool,
    pub created_at: DateTime<Utc>,
}

/// Metadata stored in JSON format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationFileMetadata {
    pub filename: String,
}

/// Request to create a new conversation file record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateConversationFileRequest {
    pub workspace_file_id: Option<String>,
    pub conversation_id: String,
    pub conversation_message_id: String,
    pub filename: String,
    pub is_attachment: bool,
}
