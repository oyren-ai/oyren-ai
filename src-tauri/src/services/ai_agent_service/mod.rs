mod chat;
mod detect_ollama_models;
mod test_provider_connection;
mod types;

pub use chat::chat;
pub use detect_ollama_models::{detect_ollama_models, DetectModelsResponse, OllamaModel};
pub use test_provider_connection::{test_provider_connection, TestConnectionResponse};
pub use types::{ChatMessage, ChatRequest, ChatRequestData, ChatResponse, ConversationMessage as FrontendConversationMessage, FileAttachment, ImageData};
