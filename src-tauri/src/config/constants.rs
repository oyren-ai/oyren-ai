/// Configuration constants for the application
/// All hardcoded values should be defined here as constants

// ============================================================================
// API ENDPOINTS
// ============================================================================

/// Gemini API base URL
pub const GEMINI_API_BASE_URL: &str = "https://generativelanguage.googleapis.com";

/// Gemini API version
pub const GEMINI_API_VERSION: &str = "v1beta";

/// DeepSeek API base URL
pub const DEEPSEEK_API_BASE_URL: &str = "https://api.deepseek.com";

/// DeepSeek API chat completions endpoint
pub const DEEPSEEK_API_CHAT_ENDPOINT: &str = "/chat/completions";

/// Version check URL for production builds
pub const VERSION_CHECK_URL_PROD: &str = "https://oyren.ai/api/version";

/// Version check URL for development builds (localhost)
pub const VERSION_CHECK_URL_DEV: &str = "http://localhost:3000/api/version";

// ============================================================================
// AI MODEL DEFAULTS
// ============================================================================

/// Default temperature for AI models (controls randomness: 0.0 = deterministic, 1.0 = creative)
pub const DEFAULT_AI_TEMPERATURE: f32 = 0.7;

/// Default max tokens for AI responses
pub const DEFAULT_AI_MAX_TOKENS: u32 = 1000;

/// Test message for health checks
pub const AI_HEALTH_CHECK_MESSAGE: &str = "Hello, world!";

// ============================================================================
// PDF PROCESSING
// ============================================================================

/// Number of context lines before a search match
pub const PDF_SEARCH_CONTEXT_LINES_BEFORE: usize = 2;

/// Number of context lines after a search match
pub const PDF_SEARCH_CONTEXT_LINES_AFTER: usize = 2;

/// Default width for placeholder PDF pages (A4 in points)
pub const PDF_PLACEHOLDER_PAGE_WIDTH: f64 = 595.0;

/// Default height for placeholder PDF pages (A4 in points)
pub const PDF_PLACEHOLDER_PAGE_HEIGHT: f64 = 842.0;

// ============================================================================
// HTTP CLIENT
// ============================================================================

/// HTTP request timeout in seconds
pub const HTTP_REQUEST_TIMEOUT_SECS: u64 = 30;

/// HTTP client user agent
pub const HTTP_USER_AGENT: &str = "Oyren-Desktop/0.1.0";

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/// Error message when API key is empty
pub const ERROR_EMPTY_API_KEY: &str = "API key not configured";

/// Error message when provider is not supported
pub const ERROR_UNSUPPORTED_PROVIDER: &str = "Unsupported provider";

/// Error message when model doesn't support images
pub const ERROR_MODEL_NO_IMAGE_SUPPORT: &str =
    "The selected model does not support image input. Please select a different model.";

/// Error message when DeepSeek doesn't support images
pub const ERROR_DEEPSEEK_NO_IMAGE_SUPPORT: &str =
    "DeepSeek models do not currently support image input.";

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

/// Maximum number of retries for API requests
pub const MAX_API_RETRIES: u32 = 3;

/// Initial retry delay in milliseconds
pub const INITIAL_RETRY_DELAY_MS: u64 = 1000;

/// Retry delay multiplier for exponential backoff
pub const RETRY_DELAY_MULTIPLIER: f64 = 2.0;

// ============================================================================
// BUFFER SIZES
// ============================================================================

/// Maximum size for file reads in bytes (10MB)
pub const MAX_FILE_SIZE_BYTES: usize = 10 * 1024 * 1024;

/// Buffer size for streaming operations
pub const STREAM_BUFFER_SIZE: usize = 8192;
