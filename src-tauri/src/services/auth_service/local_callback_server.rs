//! Local HTTP callback server for desktop auth.
//! Binds to port 0 (OS-assigned) so it never conflicts with other services.

use std::sync::OnceLock;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

static CALLBACK_PORT: OnceLock<u16> = OnceLock::new();

const SUCCESS_HTML: &str = r#"HTTP/1.1 200 OK
Content-Type: text/html
Connection: close
Access-Control-Allow-Origin: *

<!DOCTYPE html><html><body style="background:#111;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center"><h1>Authenticated!</h1><p style="color:#888">You can close this tab and return to OyrenAI.</p></div>
</body></html>"#;

const ERROR_HTML: &str = r#"HTTP/1.1 400 Bad Request
Content-Type: text/html
Connection: close

<!DOCTYPE html><html><body style="background:#111;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center"><h1>Authentication Failed</h1><p style="color:#888">No token received.</p></div>
</body></html>"#;

pub fn get_callback_port() -> Option<u16> {
    CALLBACK_PORT.get().copied()
}

pub fn start_local_callback_server(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let listener = match TcpListener::bind("127.0.0.1:0").await {
            Ok(l) => l,
            Err(e) => {
                tracing::warn!("Failed to start auth callback server: {}", e);
                return;
            }
        };

        let port = listener.local_addr().map(|a| a.port()).unwrap_or(0);
        let _ = CALLBACK_PORT.set(port);
        tracing::info!("Auth callback server listening on port {}", port);

        run_accept_loop(listener, app).await;
    });
}

async fn run_accept_loop(listener: TcpListener, app: AppHandle) {
    loop {
        let (mut socket, _) = match listener.accept().await {
            Ok(conn) => conn,
            Err(_) => continue,
        };

        let app = app.clone();
        tokio::spawn(async move {
            let mut buf = [0u8; 8192];
            let n = match socket.read(&mut buf).await {
                Ok(n) => n,
                Err(_) => return,
            };

            let request = String::from_utf8_lossy(&buf[..n]);
            let response = handle_callback_request(&request, &app);

            let _ = socket.write_all(response.as_bytes()).await;
            let _ = socket.flush().await;
        });
    }
}

fn handle_callback_request(request: &str, app: &AppHandle) -> &'static str {
    match extract_token_from_request(request) {
        Some(t) => {
            tracing::info!("Auth callback received token");
            let _ = app.emit("auth-success", t);
            SUCCESS_HTML
        }
        None => ERROR_HTML,
    }
}

fn extract_token_from_request(request: &str) -> Option<String> {
    let first_line = request.lines().next()?;
    let path = first_line.split_whitespace().nth(1)?;
    let query = path.split('?').nth(1)?;

    for param in query.split('&') {
        if let Some((key, value)) = param.split_once('=') {
            if key == "token" {
                return urlencoding::decode(value).ok().map(|s| s.to_string());
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_token() {
        let req = "GET /callback?token=abc123 HTTP/1.1\r\nHost: localhost\r\n";
        assert_eq!(extract_token_from_request(req), Some("abc123".to_string()));
    }

    #[test]
    fn test_extract_token_encoded() {
        let req = "GET /callback?token=abc%2B123 HTTP/1.1\r\n";
        assert_eq!(extract_token_from_request(req), Some("abc+123".to_string()));
    }

    #[test]
    fn test_extract_token_missing() {
        let req = "GET /callback?foo=bar HTTP/1.1\r\n";
        assert_eq!(extract_token_from_request(req), None);
    }

    #[test]
    fn test_get_callback_port_before_init() {
        // Port not set yet in test context
        // Just verify it doesn't panic
        let _ = get_callback_port();
    }
}
