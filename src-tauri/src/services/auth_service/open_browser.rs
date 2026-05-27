//! Browser opening service for authentication

#[cfg(not(test))]
use std::{process::Command, thread, time::Duration};

const AUTH_URL_PROD: &str = "https://oyren.ai/auth/signin?source=desktop-app";
const AUTH_URL_DEV: &str = "http://localhost:3000/auth/signin?source=desktop-app";

/// Max wait for callback server to be ready (ms). Server starts async at app setup.
const CALLBACK_PORT_WAIT_MS: u64 = 5000;
const CALLBACK_PORT_POLL_MS: u64 = 50;

/// Opens the authentication URL in the default browser.
/// Appends the callback server port so the web app knows where to send the token.
/// Waits up to CALLBACK_PORT_WAIT_MS for the callback server to bind if not ready yet.
pub fn open_auth_browser(is_dev: bool) -> Result<String, String> {
    let base_url = if is_dev { AUTH_URL_DEV } else { AUTH_URL_PROD };
    let port = wait_for_callback_port().ok_or_else(|| "Auth callback server not ready".to_string())?;
    let url = format!("{}&callback_port={}", base_url, port);
    open_browser_platform_specific(&url)?;
    Ok(url)
}

/// Wait for the callback server port to be set (server is started async at setup).
#[cfg(not(test))]
fn wait_for_callback_port() -> Option<u16> {
    let deadline = CALLBACK_PORT_WAIT_MS / CALLBACK_PORT_POLL_MS;
    for _ in 0..deadline {
        if let Some(port) = super::get_callback_port() {
            return Some(port);
        }
        thread::sleep(Duration::from_millis(CALLBACK_PORT_POLL_MS));
    }
    super::get_callback_port()
}

#[cfg(test)]
fn wait_for_callback_port() -> Option<u16> {
    super::get_callback_port()
}

/// Platform-specific browser opening (skipped during tests)
#[cfg(not(test))]
fn open_browser_platform_specific(url: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/C", "start", url])
            .spawn()
            .map_err(|e| format!("Failed to open browser: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(url)
            .spawn()
            .map_err(|e| format!("Failed to open browser: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(url)
            .spawn()
            .map_err(|e| format!("Failed to open browser: {}", e))?;
    }

    Ok(())
}

/// Test stub: validates URL without opening browser
#[cfg(test)]
fn open_browser_platform_specific(url: &str) -> Result<(), String> {
    // In test mode, just validate the URL format without opening browser
    if url.is_empty() {
        return Err("URL cannot be empty".to_string());
    }
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("URL must start with http:// or https://".to_string());
    }
    tracing::info!("🧪 Test mode: Would open browser to {}", url);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_open_auth_browser_fails_without_server() {
        // Port not initialized → should return error
        let result = open_auth_browser(false);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Auth callback server not ready");
    }

    #[test]
    fn test_auth_url_constants() {
        assert_eq!(AUTH_URL_PROD, "https://oyren.ai/auth/signin?source=desktop-app");
        assert_eq!(AUTH_URL_DEV, "http://localhost:3000/auth/signin?source=desktop-app");
    }

    #[test]
    fn test_browser_stub_validates_empty_url() {
        let result = open_browser_platform_specific("");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "URL cannot be empty");
    }

    #[test]
    fn test_browser_stub_validates_http_protocol() {
        let result = open_browser_platform_specific("http://example.com");
        assert!(result.is_ok());
    }

    #[test]
    fn test_browser_stub_validates_https_protocol() {
        let result = open_browser_platform_specific("https://example.com");
        assert!(result.is_ok());
    }

    #[test]
    fn test_browser_stub_rejects_invalid_protocol() {
        let result = open_browser_platform_specific("ftp://example.com");
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "URL must start with http:// or https://"
        );
    }
}