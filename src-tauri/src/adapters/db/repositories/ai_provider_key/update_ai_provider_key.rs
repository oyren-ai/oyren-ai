use crate::adapters::db::models::{AiProviderKey, UpdateAiProviderKeyRequest};
use sqlx::SqlitePool;

use super::get_ai_provider_key;

pub async fn update_ai_provider_key(
    pool: &SqlitePool,
    id: &str,
    request: UpdateAiProviderKeyRequest,
) -> Result<AiProviderKey, String> {
    if request.name.trim().is_empty() {
        return Err("API key name cannot be empty".to_string());
    }

    let mut provider_key = get_ai_provider_key(pool, id)
        .await?
        .ok_or_else(|| "AI provider key not found".to_string())?;

    provider_key.name = request.name.clone();

    sqlx::query("UPDATE ai_provider_keys SET name = ? WHERE id = ?")
        .bind(&request.name)
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to update AI provider key: {}", e))?;

    Ok(provider_key)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::CreateAiProviderKeyRequest;
    use crate::adapters::db::repositories::ai_provider_key::create_ai_provider_key;
    use crate::adapters::db::test_utils::setup_test_db;
    use sqlx::SqlitePool;
    use tempfile::TempDir;

    async fn setup_db_with_providers() -> (SqlitePool, TempDir) {
        let (pool, temp_dir) = setup_test_db().await;

        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("INSERT INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("gemini")
            .bind("gemini")
            .bind(&now)
            .execute(&pool)
            .await
            .expect("Failed to insert gemini provider");

        (pool, temp_dir)
    }

    #[tokio::test]
    async fn test_update_ai_provider_key_success() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let request = CreateAiProviderKeyRequest {
            provider_id: "gemini".to_string(),
            name: "Test Name".to_string(),
            key: "test-key-123".to_string(),
        };
        let created = create_ai_provider_key(&pool, request).await.unwrap();

        let update_request = UpdateAiProviderKeyRequest {
            name: "Updated Name".to_string(),
        };
        let result = update_ai_provider_key(&pool, &created.id, update_request).await;
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.key, "test-key-123");
        assert_eq!(updated.ai_provider.name, "gemini");
    }

    #[tokio::test]
    async fn test_update_ai_provider_key_not_found() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let update_request = UpdateAiProviderKeyRequest {
            name: "Test".to_string(),
        };
        let result = update_ai_provider_key(&pool, "nonexistent-id", update_request).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "AI provider key not found");
    }

    #[tokio::test]
    async fn test_update_ai_provider_key_empty_name() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let request = CreateAiProviderKeyRequest {
            provider_id: "gemini".to_string(),
            name: "Test Name".to_string(),
            key: "test-key".to_string(),
        };
        let created = create_ai_provider_key(&pool, request).await.unwrap();

        let update_request = UpdateAiProviderKeyRequest {
            name: "   ".to_string(),
        };
        let result = update_ai_provider_key(&pool, &created.id, update_request).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "API key name cannot be empty");
    }
}
