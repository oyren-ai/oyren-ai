pub mod ai_agent_service;
pub mod ai_provider_key_service;
pub mod arxiv_search_service;
pub mod ai_provider_model_service;
pub mod auth_service;
pub mod bookmark_service;
pub mod conversation;
pub mod document;
pub mod marker_conversion;
pub mod sync_service;
pub mod updater;
pub mod utils;
pub mod workspace_files_service;
pub mod workspace_prompt_service;
pub mod workspace_service;

// Re-export types that are used across multiple places
pub use ai_agent_service::{ChatMessage, ChatRequest, ChatResponse, FileAttachment, ImageData};
pub use document::PdfPageContent;
pub use document::PdfProcessingResult;
pub use updater::UpdateInfo;
pub use workspace_files_service::AddFileResult;
