use crate::services::ai_agent_service::{FileAttachment, ImageData};
use serde::{Deserialize, Serialize};

/// Request types for AI agent sidecar operations
#[derive(Serialize)]
#[serde(tag = "operation")]
#[serde(rename_all = "kebab-case")]
pub enum AgentRequest {
    Chat {
        message: String,
        #[serde(rename = "aiProvider")]
        ai_provider: AiProvider,
        #[serde(rename = "conversationHistory")]
        conversation_history: Vec<ConversationMessage>,
        model: String,
        temperature: Option<f32>,
        #[serde(rename = "maxTokens")]
        max_tokens: Option<u32>,
        #[serde(rename = "answerMode")]
        answer_mode: Option<String>,
        #[serde(default)]
        images: Vec<ImageData>,
        #[serde(default)]
        files: Vec<FileAttachment>,
        #[serde(rename = "attachedFileNames")]
        #[serde(default)]
        attached_file_names: Vec<String>,
    },
    DetectModels {
        provider: String,
    },
    TestConnection {
        #[serde(rename = "aiProvider")]
        ai_provider: AiProvider,
        model: String,
    },
}

#[derive(Serialize, Deserialize)]
pub struct AiProvider {
    pub provider: String,
    #[serde(rename = "apiKey")]
    pub api_key: String,
}

#[derive(Serialize, Deserialize)]
pub struct ConversationMessage {
    pub role: String,
    pub content: String,
}
