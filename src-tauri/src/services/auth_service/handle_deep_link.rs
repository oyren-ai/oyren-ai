//! Deep link handling service for authentication

use tauri::{Emitter, WebviewWindow};

/// Parse authentication token from deep link URL
///
/// Expected format: oyren://auth?token=xxx
pub fn parse_auth_token_from_url(url: &str) -> Result<String, String> {
    // Extract query string
    let query = url
        .split('?')
        .nth(1)
        .ok_or_else(|| "Deep link missing query string (expected ?token=...)".to_string())?;

    // Parse query parameters
    for param in query.split('&') {
        if let Some((key, value)) = param.split_once('=') {
            if key == "token" {
                // Decode token
                return urlencoding::decode(value)
                    .map(|s| s.to_string())
                    .map_err(|e| format!("Failed to decode token: {}", e));
            }
        }
    }

    Err("No token parameter found in authentication URL".to_string())
}

/// Handle deep link callback from browser
pub fn handle_deep_link(window: &WebviewWindow, url: &str) {
    tracing::info!("🔗 Received deep link: {}", url);

    // Focus and show window
    focus_window(window);

    // Parse token and emit event
    match parse_auth_token_from_url(url) {
        Ok(token) => {
            tracing::info!("✅ Token received successfully");
            if let Err(e) = window.emit("auth-success", token) {
                tracing::error!("Failed to emit auth-success event: {}", e);
            } else {
                tracing::info!("🎉 Auth success event emitted to frontend");
            }
        }
        Err(error_msg) => {
            tracing::error!("❌ {}", error_msg);
            let _ = window.emit("auth-error", error_msg);
        }
    }
}

/// Focus and show the window
fn focus_window(window: &WebviewWindow) {
    if let Err(e) = window.set_focus() {
        tracing::warn!("Failed to focus window: {}", e);
    }

    if let Err(e) = window.show() {
        tracing::warn!("Failed to show window: {}", e);
    }

    if let Err(e) = window.unminimize() {
        tracing::warn!("Failed to unminimize window: {}", e);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_auth_token_success() {
        let url = "oyren://auth?token=abc123xyz";
        let result = parse_auth_token_from_url(url);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "abc123xyz");
    }

    #[test]
    fn test_parse_auth_token_with_encoded_characters() {
        let url = "oyren://auth?token=abc%2B123%3Dxyz";
        let result = parse_auth_token_from_url(url);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "abc+123=xyz");
    }

    #[test]
    fn test_parse_auth_token_with_multiple_params() {
        let url = "oyren://auth?foo=bar&token=test123&baz=qux";
        let result = parse_auth_token_from_url(url);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test123");
    }

    #[test]
    fn test_parse_auth_token_missing_query_string() {
        let url = "oyren://auth";
        let result = parse_auth_token_from_url(url);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "Deep link missing query string (expected ?token=...)"
        );
    }

    #[test]
    fn test_parse_auth_token_missing_token_param() {
        let url = "oyren://auth?foo=bar&baz=qux";
        let result = parse_auth_token_from_url(url);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "No token parameter found in authentication URL"
        );
    }

    #[test]
    fn test_parse_auth_token_empty_token_value() {
        let url = "oyren://auth?token=";
        let result = parse_auth_token_from_url(url);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "");
    }

    #[test]
    fn test_parse_auth_token_malformed_param() {
        let url = "oyren://auth?malformed&token=valid123";
        let result = parse_auth_token_from_url(url);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "valid123");
    }

    #[test]
    fn test_parse_auth_token_special_characters() {
        let url = "oyren://auth?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
        let result = parse_auth_token_from_url(url);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    }
}