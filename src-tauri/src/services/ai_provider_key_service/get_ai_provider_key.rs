use crate::adapters::db::{repositories, sqlite, AiProviderKey};

pub async fn get_ai_provider_key(id: String) -> Result<Option<AiProviderKey>, String> {
    let pool = sqlite::get_db_pool()?;
    repositories::ai_provider_key::get_ai_provider_key(pool, &id).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::sqlite;
    use crate::services::ai_provider_key_service;
    use chrono::Utc;

    async fn setup_test_providers() {
        crate::adapters::db::test_utils::init_test_db().await;
        let pool = sqlite::get_db_pool().expect("Failed to get DB pool");
        let now = Utc::now().to_rfc3339();

        let _ = sqlx::query("INSERT OR IGNORE INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("gemini")
            .bind("gemini")
            .bind(&now)
            .execute(pool)
            .await;
    }

    #[tokio::test]
    async fn test_get_ai_provider_key_found() {
        setup_test_providers().await;

        // Create a key first
        let created = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "Test Key".to_string(),
            "api-key-123".to_string(),
        )
        .await
        .expect("Failed to create key");

        // Now retrieve it
        let result = get_ai_provider_key(created.id.clone()).await;

        assert!(result.is_ok());
        let found = result.unwrap();
        assert!(found.is_some());

        let key = found.unwrap();
        assert_eq!(key.id, created.id);
        assert_eq!(key.name, "Test Key");
        assert_eq!(key.key, "api-key-123");
        assert_eq!(key.ai_provider.id, "gemini");
    }

    #[tokio::test]
    async fn test_get_ai_provider_key_not_found() {
        setup_test_providers().await;

        let result = get_ai_provider_key("nonexistent-id".to_string()).await;

        assert!(result.is_ok());
        let found = result.unwrap();
        assert!(found.is_none());
    }

    #[tokio::test]
    async fn test_get_ai_provider_key_empty_id() {
        setup_test_providers().await;

        let result = get_ai_provider_key("".to_string()).await;

        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_get_ai_provider_key_preserves_data() {
        setup_test_providers().await;

        // Create key with specific data
        let created = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "My Special Key 🔑".to_string(),
            "sk-very-long-api-key-with-special-chars-123_456".to_string(),
        )
        .await
        .expect("Failed to create key");

        // Retrieve and verify all fields are preserved
        let result = get_ai_provider_key(created.id).await;
        assert!(result.is_ok());

        let key = result.unwrap().expect("Key should exist");
        assert_eq!(key.name, "My Special Key 🔑");
        assert_eq!(key.key, "sk-very-long-api-key-with-special-chars-123_456");
        assert!(!key.is_local);
    }
}
