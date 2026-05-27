use crate::adapters::db::{repositories, sqlite, AiProviderKey, UpdateAiProviderKeyRequest};

pub async fn update_ai_provider_key(id: String, name: String) -> Result<AiProviderKey, String> {
    let pool = sqlite::get_db_pool()?;

    if name.trim().is_empty() {
        return Err("API key name cannot be empty".to_string());
    }

    let request = UpdateAiProviderKeyRequest { name };

    repositories::ai_provider_key::update_ai_provider_key(pool, &id, request).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::CreateAiProviderKeyRequest;
    use crate::adapters::db::repositories;
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
    async fn test_update_ai_provider_key_empty_name() {
        let result = update_ai_provider_key("test-id".to_string(), "   ".to_string()).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "API key name cannot be empty");
    }

    #[tokio::test]
    async fn test_repository_update_success() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let request = CreateAiProviderKeyRequest {
            provider_id: "gemini".to_string(),
            name: "Original Name".to_string(),
            key: "test-key-123".to_string(),
        };
        let created = repositories::ai_provider_key::create_ai_provider_key(&pool, request)
            .await
            .unwrap();

        let update_request = UpdateAiProviderKeyRequest {
            name: "Updated Name".to_string(),
        };
        let result = repositories::ai_provider_key::update_ai_provider_key(
            &pool,
            &created.id,
            update_request,
        )
        .await;

        assert!(result.is_ok());
        let updated = result.unwrap();
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.key, "test-key-123");
    }

    #[tokio::test]
    async fn test_repository_update_not_found() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let update_request = UpdateAiProviderKeyRequest {
            name: "Test".to_string(),
        };
        let result = repositories::ai_provider_key::update_ai_provider_key(
            &pool,
            "nonexistent-id",
            update_request,
        )
        .await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "AI provider key not found");
    }
}
