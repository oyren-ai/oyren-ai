use crate::adapters::db::models::AiProviderKey;
use crate::services::ai_provider_key_service;

#[tauri::command]
pub async fn create_ai_provider_key(
    provider_id: String,
    name: String,
    key: String,
) -> Result<AiProviderKey, String> {
    ai_provider_key_service::create_ai_provider_key(provider_id, name, key).await
}

#[tauri::command]
pub async fn get_ai_provider_key(id: String) -> Result<Option<AiProviderKey>, String> {
    ai_provider_key_service::get_ai_provider_key(id).await
}

#[tauri::command]
pub async fn list_ai_provider_keys(app: tauri::AppHandle) -> Result<Vec<AiProviderKey>, String> {
    ai_provider_key_service::list_ai_provider_keys(&app).await
}

#[tauri::command]
pub async fn update_ai_provider_key(id: String, name: String) -> Result<AiProviderKey, String> {
    ai_provider_key_service::update_ai_provider_key(id, name).await
}

#[tauri::command]
pub async fn delete_ai_provider_key(id: String) -> Result<(), String> {
    ai_provider_key_service::delete_ai_provider_key(id).await
}
