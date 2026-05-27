mod request;
mod response;

pub use request::{AgentRequest, AiProvider, ConversationMessage};
pub use response::{
    ArxivPaper, ChatResponse, DetectModelsResponse, OllamaModel, UserIntent,
    SidecarError, SidecarResponse, TestConnectionResponse,
};
