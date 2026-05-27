use tauri::State;
use crate::state::active_request::ActiveRequest;

/// Cancel the currently active AI request
#[tauri::command]
pub async fn cancel_ai_request(
    request_id: String,
    active_request: State<'_, ActiveRequest>,
) -> Result<(), String> {
    tracing::info!("🛑 Cancel request received for: {}", request_id);
    active_request.cancel(&request_id).await
}
