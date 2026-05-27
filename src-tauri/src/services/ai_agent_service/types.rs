use serde::{Deserialize, Serialize};
use crate::adapters::sidecars::ai_agent::types::SidecarError as AdapterSidecarError;
use crate::adapters::sidecars::ai_agent::types::ArxivPaper;
use crate::adapters::sidecars::ai_agent::types::UserIntent;

/// Structured error from AI sidecar
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarError {
    #[serde(rename = "errorType")]
    pub error_type: String,
    #[serde(rename = "shortMessage")]
    pub short_message: Option<String>,
    pub message: Option<String>,
    pub suggestion: Option<String>,
}

/// Image data for AI requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageData {
    pub mime_type: String,
    pub data: String,
    #[serde(default)]
    pub name: Option<String>,
}

/// File attachment for AI requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileAttachment {
    pub data: String,
    pub mime_type: String,
    pub filename: String,
}

/// Chat message for conversation history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// Frontend chat request data (from Tauri commands)
#[derive(Debug, Clone, Deserialize)]
pub struct ChatRequestData {
    pub message: String,
    pub provider: String,
    pub api_key: String,
    pub model: String,
    pub conversation_history: Vec<ConversationMessage>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub answer_mode: Option<String>,
    #[serde(default)]
    pub images: Vec<ImageData>,
    #[serde(default)]
    pub files: Vec<FileAttachment>,
    #[serde(default)]
    pub attached_file_names: Vec<String>,
}

impl From<ChatRequestData> for ChatRequest {
    fn from(request_data: ChatRequestData) -> Self {
        ChatRequest {
            message: request_data.message,
            images: request_data.images.clone(),
            files: request_data.files.clone(),
            conversation_history: request_data
                .conversation_history
                .into_iter()
                .map(|msg| ChatMessage {
                    role: msg.role,
                    content: msg.content,
                })
                .collect(),
            model: request_data.model,
            temperature: request_data.temperature.unwrap_or(0.7),
            max_tokens: request_data.max_tokens,
            provider: request_data.provider.clone(),
            answer_mode: request_data.answer_mode,
            attached_file_names: request_data.attached_file_names,
        }
    }
}

/// Conversation message from frontend (matches ConversationMessage from adapter)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationMessage {
    pub role: String,
    pub content: String,
}

/// Chat request to AI service
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    pub message: String,
    #[serde(default)]
    pub images: Vec<ImageData>,
    #[serde(default)]
    pub files: Vec<FileAttachment>,
    pub conversation_history: Vec<ChatMessage>,
    pub model: String,
    pub temperature: f32,
    pub max_tokens: Option<u32>,
    pub provider: String,
    pub answer_mode: Option<String>,
    #[serde(default)]
    pub attached_file_names: Vec<String>,
}

/// Token usage metadata from AI providers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageMetadata {
    pub input_tokens: Option<i32>,
    pub output_tokens: Option<i32>,
    pub total_tokens: Option<i32>,
}

/// Chat response from AI service
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub response: String,
    pub usage_metadata: Option<UsageMetadata>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sidecar_error: Option<SidecarError>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub arxiv_papers: Option<Vec<ArxivPaper>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_intent: Option<UserIntent>,
}
