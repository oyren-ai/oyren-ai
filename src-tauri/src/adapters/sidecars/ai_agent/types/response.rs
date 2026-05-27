use serde::{Deserialize, Serialize};

/// Structured error from sidecar
#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct SidecarError {
    #[serde(rename = "errorType")]
    pub error_type: String,
    #[serde(rename = "shortMessage")]
    pub short_message: Option<String>,
    pub message: Option<String>,
    pub suggestion: Option<String>,
}

/// Generic sidecar response wrapper
#[derive(Deserialize)]
pub struct SidecarResponse<T> {
    pub data: Option<T>,
    pub error: Option<SidecarError>,
}

/// User intent from intent extraction
#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct UserIntent {
    pub intent: String,
    pub topics: Vec<String>,
    pub keywords: Vec<String>,
    pub authors: Option<Vec<String>>,
    pub categories: Option<Vec<String>>,
}

/// ArXiv paper metadata from tool calling
#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct ArxivPaper {
    pub id: String,
    pub title: String,
    pub authors: Vec<String>,
    pub summary: String,
    pub arxiv_url: String,
    pub pdf_url: String,
    pub published: String,
}

/// Chat operation response
#[derive(Deserialize, Serialize, Clone)]
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

/// Token usage metadata from AI providers
#[derive(Deserialize, Serialize, Clone)]
pub struct UsageMetadata {
    pub input_tokens: Option<i32>,
    pub output_tokens: Option<i32>,
    pub total_tokens: Option<i32>,
}

/// Detect models operation response
#[derive(Deserialize, Serialize, Clone)]
pub struct DetectModelsResponse {
    pub models: Vec<OllamaModel>,
}

/// Ollama model information
#[derive(Deserialize, Serialize, Clone)]
pub struct OllamaModel {
    pub name: String,
    pub size: u64,
    pub modified_at: String,
}

/// Test connection operation response
#[derive(Deserialize, Serialize, Clone)]
pub struct TestConnectionResponse {
    pub success: bool,
    pub provider: String,
    pub model: String,
    pub message: String,
}
