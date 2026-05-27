use crate::adapters::db::{repositories, sqlite, AiProviderKey, CreateAiProviderKeyRequest};

pub async fn create_ai_provider_key(
    provider_id: String,
    name: String,
    key: String,
) -> Result<AiProviderKey, String> {
    let pool = sqlite::get_db_pool()?;

    if key.trim().is_empty() {
        return Err("API key cannot be empty".to_string());
    }

    let request = CreateAiProviderKeyRequest {
        provider_id,
        name,
        key,
    };

    repositories::ai_provider_key::create_ai_provider_key(pool, request).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::sqlite;
    use chrono::Utc;

    async fn setup_test_providers() {
        crate::adapters::db::test_utils::init_test_db().await;
        let pool = sqlite::get_db_pool().expect("Failed to get DB pool");
        let now = Utc::now().to_rfc3339();

        // Insert test providers
        let _ = sqlx::query("INSERT OR IGNORE INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("gemini")
            .bind("gemini")
            .bind(&now)
            .execute(pool)
            .await;

        let _ = sqlx::query("INSERT OR IGNORE INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("deepseek")
            .bind("deepseek")
            .bind(&now)
            .execute(pool)
            .await;
    }

    #[tokio::test]
    async fn test_create_ai_provider_key_success() {
        setup_test_providers().await;

        let result = create_ai_provider_key(
            "gemini".to_string(),
            "My Gemini Key".to_string(),
            "test-api-key-123".to_string(),
        )
        .await;

        assert!(result.is_ok());
        let created = result.unwrap();
        assert_eq!(created.ai_provider.id, "gemini");
        assert_eq!(created.name, "My Gemini Key");
        assert_eq!(created.key, "test-api-key-123");
        assert!(!created.id.is_empty());
    }

    #[tokio::test]
    async fn test_create_ai_provider_key_empty_key() {
        setup_test_providers().await;

        let result = create_ai_provider_key(
            "gemini".to_string(),
            "My Key".to_string(),
            "".to_string(),
        )
        .await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "API key cannot be empty");
    }

    #[tokio::test]
    async fn test_create_ai_provider_key_whitespace_only_key() {
        setup_test_providers().await;

        let result = create_ai_provider_key(
            "gemini".to_string(),
            "My Key".to_string(),
            "   \t\n  ".to_string(),
        )
        .await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "API key cannot be empty");
    }

    #[tokio::test]
    async fn test_create_ai_provider_key_invalid_provider() {
        setup_test_providers().await;

        let result = create_ai_provider_key(
            "nonexistent-provider".to_string(),
            "My Key".to_string(),
            "valid-key".to_string(),
        )
        .await;

        assert!(result.is_err());
        // Should fail due to foreign key constraint
    }

    #[tokio::test]
    async fn test_create_ai_provider_key_multiple_keys_same_provider() {
        setup_test_providers().await;

        let result1 = create_ai_provider_key(
            "gemini".to_string(),
            "Key 1".to_string(),
            "key-1".to_string(),
        )
        .await;
        assert!(result1.is_ok());

        let result2 = create_ai_provider_key(
            "gemini".to_string(),
            "Key 2".to_string(),
            "key-2".to_string(),
        )
        .await;
        assert!(result2.is_ok());

        // Both should have different IDs
        assert_ne!(result1.unwrap().id, result2.unwrap().id);
    }

    #[tokio::test]
    async fn test_create_ai_provider_key_different_providers() {
        setup_test_providers().await;

        let gemini_result = create_ai_provider_key(
            "gemini".to_string(),
            "Gemini Key".to_string(),
            "gemini-key".to_string(),
        )
        .await;
        assert!(gemini_result.is_ok());

        let deepseek_result = create_ai_provider_key(
            "deepseek".to_string(),
            "DeepSeek Key".to_string(),
            "deepseek-key".to_string(),
        )
        .await;
        assert!(deepseek_result.is_ok());

        assert_eq!(gemini_result.unwrap().ai_provider.id, "gemini");
        assert_eq!(deepseek_result.unwrap().ai_provider.id, "deepseek");
    }

    #[tokio::test]
    async fn test_create_ai_provider_key_with_special_characters() {
        setup_test_providers().await;

        let result = create_ai_provider_key(
            "gemini".to_string(),
            "Key with 特殊字符 & symbols!".to_string(),
            "sk-1234567890abcdef_-=+[]{}".to_string(),
        )
        .await;

        assert!(result.is_ok());
        let created = result.unwrap();
        assert_eq!(created.name, "Key with 特殊字符 & symbols!");
        assert_eq!(created.key, "sk-1234567890abcdef_-=+[]{}");
    }
}
