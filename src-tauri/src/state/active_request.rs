use std::sync::Arc;
use tokio::sync::RwLock;
use tauri_plugin_shell::process::CommandChild;

/// Tracks the single active AI request
/// Only one request can be active at a time
pub struct ActiveRequest {
    pub(crate) current: Arc<RwLock<Option<(String, CommandChild)>>>,
}

impl ActiveRequest {
    pub fn new() -> Self {
        Self {
            current: Arc::new(RwLock::new(None)),
        }
    }

    /// Register a new request, replacing any existing one
    pub async fn register(&self, request_id: String, child: CommandChild) {
        let mut current = self.current.write().await;
        
        // Kill any existing process before replacing
        if let Some((old_id, old_child)) = current.take() {
            tracing::warn!("⚠️  Replacing active request {} with {}", old_id, request_id);
            let _ = old_child.kill();
        }
        
        *current = Some((request_id, child));
        tracing::debug!("✅ Registered active request");
    }

    /// Cancel the request if it matches the given ID
    pub async fn cancel(&self, request_id: &str) -> Result<(), String> {
        let mut current = self.current.write().await;
        
        if let Some((id, child)) = current.take() {
            if id == request_id {
                tracing::info!("🛑 Cancelling request: {}", request_id);
                child.kill().map_err(|e| format!("Failed to kill process: {}", e))?;
                Ok(())
            } else {
                // Wrong ID, put it back
                *current = Some((id, child));
                Err(format!("Request {} not found (current: {})", request_id, current.as_ref().map(|(id, _)| id.as_str()).unwrap_or("none")))
            }
        } else {
            Err("No active request to cancel".to_string())
        }
    }

    /// Remove the request after completion (called by executor)
    pub async fn complete(&self, request_id: &str) {
        let mut current = self.current.write().await;
        
        if let Some((id, _)) = current.as_ref() {
            if id == request_id {
                current.take();
                tracing::debug!("✅ Request {} completed", request_id);
            }
        }
    }

    /// Kill all active requests (for cleanup on shutdown)
    pub async fn kill_all(&self) {
        let mut current = self.current.write().await;
        
        if let Some((id, child)) = current.take() {
            tracing::info!("🛑 Killing active request on shutdown: {}", id);
            let _ = child.kill();
        }
    }
}

impl Default for ActiveRequest {
    fn default() -> Self {
        Self::new()
    }
}
