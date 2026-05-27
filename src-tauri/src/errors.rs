use serde::{Deserialize, Serialize};
use std::io;

// ============================================================================
// ADAPTER LAYER ERRORS
// ============================================================================

/// File system operation errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileError {
    NotFound { path: String },
    NotAFile { path: String },
    PermissionDenied { path: String },
    IoError { message: String },
}

/// ArXiv API errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ArxivApiError {
    NetworkError { message: String },
    InvalidResponse { message: String },
}

/// Marker API errors (PDF-to-Markdown conversion)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MarkerApiError {
    NetworkError { message: String },
    AuthError { message: String },
    ServerError { message: String },
    InvalidResponse { message: String },
    ZipExtractionError { message: String },
}

// ============================================================================
// SERVICE LAYER ERRORS
// ============================================================================

/// Sidecar execution errors with detailed context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarError {
    pub error_type: SidecarErrorType,
    pub exit_code: i32,
    pub stderr: String,
    pub temp_file_path: String,
    pub payload_size: usize,
    pub suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SidecarErrorType {
    FileReadError,      // Sidecar couldn't read temp file
    PermissionDenied,   // Permission issues
    ProcessKilled,      // Process was terminated
    Timeout,            // Request timed out
    PayloadTooLarge,    // Request size exceeded limits
    Unknown,            // Unknown error
}

impl SidecarError {
    pub fn to_user_friendly_message(&self) -> String {
        let base_message = match self.error_type {
            SidecarErrorType::FileReadError => {
                format!(
                    "AI agent couldn't read the request file.\nFile: {}\nSize: {} KB",
                    self.temp_file_path,
                    self.payload_size / 1024
                )
            },
            SidecarErrorType::PermissionDenied => {
                "Permission denied. The AI agent doesn't have access to temporary files.".to_string()
            },
            SidecarErrorType::ProcessKilled => {
                "AI agent process was terminated unexpectedly.".to_string()
            },
            SidecarErrorType::Timeout => {
                format!("AI agent timed out after processing {} KB of data.", self.payload_size / 1024)
            },
            SidecarErrorType::PayloadTooLarge => {
                format!(
                    "Request is too large ({} KB). The system cannot process files of this size.",
                    self.payload_size / 1024
                )
            },
            SidecarErrorType::Unknown => {
                format!("AI agent failed with exit code {}", self.exit_code)
            },
        };

        let mut message = base_message;
        
        if !self.stderr.is_empty() && self.stderr.len() < 500 {
            message.push_str(&format!("\n\nDetails: {}", self.stderr));
        }

        if !self.suggestions.is_empty() {
            message.push_str("\n\nSuggested solutions:\n");
            for (i, suggestion) in self.suggestions.iter().enumerate() {
                message.push_str(&format!("  {}. {}\n", i + 1, suggestion));
            }
        }

        message
    }
}

/// AI service errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AiServiceError {
    ProviderNotSupported { provider: String },
    ProviderDoesNotSupportImages { provider: String },
    FeatureNotSupported { message: String },
    EmptyApiKey,
    FileError { source: FileError },
    InvalidInput { message: String },
    SidecarExecutionFailed { details: SidecarError },
}

/// PDF service errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PdfServiceError {
    FileError { source: FileError },
    FileSystemError { message: String },
    ExtractionFailed { message: String },
    InvalidPdf { path: String },
    ProcessingError { message: String },
    DatabaseError { message: String },
    UnsupportedFileType { extension: String },
}

/// Updater service errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdaterError {
    UpdaterInitFailed { message: String },
    CheckFailed { message: String },
    NoUpdateAvailable,
    InstallFailed { message: String },
}

// ============================================================================
// COMMAND LAYER ERRORS
// ============================================================================

/// Command layer errors (converted to String for Tauri)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommandError {
    AiService { source: AiServiceError },
    PdfService { source: PdfServiceError },
    Updater { source: UpdaterError },
    InvalidArgument { message: String },
}

// ============================================================================
// EXPLICIT CONVERSION FUNCTIONS (Functional Style)
// ============================================================================

// IO Error conversions
pub fn io_error_to_file_error(err: io::Error) -> FileError {
    match err.kind() {
        io::ErrorKind::NotFound => FileError::IoError {
            message: err.to_string(),
        },
        io::ErrorKind::PermissionDenied => FileError::PermissionDenied {
            path: String::new(),
        },
        _ => FileError::IoError {
            message: err.to_string(),
        },
    }
}

// File Error conversions
pub fn file_error_to_ai_service_error(err: FileError) -> AiServiceError {
    AiServiceError::FileError { source: err }
}

pub fn file_error_to_pdf_service_error(err: FileError) -> PdfServiceError {
    PdfServiceError::FileError { source: err }
}

pub fn marker_api_error_to_pdf_service_error(err: MarkerApiError) -> PdfServiceError {
    PdfServiceError::ExtractionFailed {
        message: marker_api_error_to_string(&err),
    }
}

// Service to Command conversions
pub fn ai_service_error_to_command_error(err: AiServiceError) -> CommandError {
    CommandError::AiService { source: err }
}

pub fn pdf_service_error_to_command_error(err: PdfServiceError) -> CommandError {
    CommandError::PdfService { source: err }
}

pub fn updater_error_to_command_error(err: UpdaterError) -> CommandError {
    CommandError::Updater { source: err }
}

// Command to String for Tauri
pub fn command_error_to_string(err: CommandError) -> String {
    match err {
        CommandError::AiService { source } => format!("AI Service Error: {:?}", source),
        CommandError::PdfService { source } => format!("PDF Service Error: {:?}", source),
        CommandError::Updater { source } => updater_error_to_string(&source),
        CommandError::InvalidArgument { message } => format!("Invalid Argument: {}", message),
    }
}

// ============================================================================
// DISPLAY IMPLEMENTATIONS (for better error messages)
// ============================================================================

pub fn file_error_to_string(err: &FileError) -> String {
    match err {
        FileError::NotFound { path } => format!("File not found: {}", path),
        FileError::NotAFile { path } => format!("Path is not a file: {}", path),
        FileError::PermissionDenied { path } => format!("Permission denied: {}", path),
        FileError::IoError { message } => format!("IO error: {}", message),
    }
}

pub fn ai_service_error_to_string(err: &AiServiceError) -> String {
    match err {
        AiServiceError::ProviderNotSupported { provider } => {
            format!("Provider not supported: {}", provider)
        }
        AiServiceError::ProviderDoesNotSupportImages { provider } => {
            format!("Provider '{}' does not support images", provider)
        }
        AiServiceError::FeatureNotSupported { message } => message.clone(),
        AiServiceError::EmptyApiKey => "API key is empty".to_string(),
        AiServiceError::FileError { source } => file_error_to_string(source),
        AiServiceError::InvalidInput { message } => format!("Invalid input: {}", message),
        AiServiceError::SidecarExecutionFailed { details } => details.to_user_friendly_message(),
    }
}

pub fn pdf_service_error_to_string(err: &PdfServiceError) -> String {
    match err {
        PdfServiceError::FileError { source } => file_error_to_string(source),
        PdfServiceError::FileSystemError { message } => {
            format!("File system error: {}", message)
        }
        PdfServiceError::ExtractionFailed { message } => {
            format!("PDF extraction failed: {}", message)
        }
        PdfServiceError::InvalidPdf { path } => format!("Invalid PDF file: {}", path),
        PdfServiceError::ProcessingError { message } => {
            format!("PDF processing error: {}", message)
        }
        PdfServiceError::DatabaseError { message } => {
            format!("Database error: {}", message)
        }
        PdfServiceError::UnsupportedFileType { extension } => {
            format!("Unsupported file type: {}", extension)
        }
    }
}

pub fn marker_api_error_to_string(err: &MarkerApiError) -> String {
    match err {
        MarkerApiError::NetworkError { message } => format!("Marker API network error: {}", message),
        MarkerApiError::AuthError { message } => format!("Marker API auth error: {}", message),
        MarkerApiError::ServerError { message } => format!("Marker API server error: {}", message),
        MarkerApiError::InvalidResponse { message } => {
            format!("Marker API invalid response: {}", message)
        }
        MarkerApiError::ZipExtractionError { message } => {
            format!("Zip extraction error: {}", message)
        }
    }
}

pub fn updater_error_to_string(err: &UpdaterError) -> String {
    match err {
        UpdaterError::UpdaterInitFailed { message } => {
            format!("Failed to initialize updater: {}", message)
        }
        UpdaterError::CheckFailed { message } => {
            format!("Failed to check for updates: {}", message)
        }
        UpdaterError::NoUpdateAvailable => "No update available".to_string(),
        UpdaterError::InstallFailed { message } => {
            format!("Failed to install update: {}", message)
        }
    }
}

pub fn arxiv_api_error_to_string(err: &ArxivApiError) -> String {
    match err {
        ArxivApiError::NetworkError { message } => {
            format!("ArXiv API network error: {}", message)
        }
        ArxivApiError::InvalidResponse { message } => {
            format!("ArXiv API invalid response: {}", message)
        }
    }
}
