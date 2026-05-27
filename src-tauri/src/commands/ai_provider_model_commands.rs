use crate::adapters::db::models::AiProviderModel;
use crate::services::ai_provider_model_service;

#[tauri::command]
pub async fn get_ai_provider_model(id: String) -> Result<Option<AiProviderModel>, String> {
    ai_provider_model_service::get_ai_provider_model_by_id(id).await
}

#[tauri::command]
pub async fn list_ai_provider_models(
    provider_id: String,
) -> Result<Vec<AiProviderModel>, String> {
    ai_provider_model_service::get_models_by_provider_id(provider_id).await
}

#[tauri::command]
pub async fn update_ai_provider_model_active(
    id: String,
    is_active: bool,
) -> Result<AiProviderModel, String> {
    ai_provider_model_service::update_ai_provider_model_active(id, is_active).await
}