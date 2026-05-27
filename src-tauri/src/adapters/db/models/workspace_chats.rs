use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use super::conversation_file::ConversationFile;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub provider: String,
    pub model: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_accessed_at: DateTime<Utc>,
    pub is_pinned: bool,
    pub is_archived: bool,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationMessage {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub images: Option<String>,
    pub created_at: DateTime<Utc>,
    pub sequence_number: i32,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub input_tokens: Option<i32>,
    pub output_tokens: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attached_files: Option<Vec<ConversationFile>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationWithMessages {
    pub conversation: Conversation,
    pub messages: Vec<ConversationMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateConversationRequest {
    pub workspace_id: String,
    pub title: String,
    pub provider: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMessageRequest {
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub images: Option<Vec<ImageData>>,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub input_tokens: Option<i32>,
    pub output_tokens: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageData {
    pub data: String,
    pub mime_type: String,
}
