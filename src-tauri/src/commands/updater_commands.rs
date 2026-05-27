use crate::errors::updater_error_to_command_error;
use crate::services::updater;
use crate::services::UpdateInfo;

#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<UpdateInfo, String> {
    updater::check_for_updates(&app)
        .await
        .map_err(|e| updater_error_to_command_error(e))
        .map_err(|e| crate::errors::command_error_to_string(e))
}
