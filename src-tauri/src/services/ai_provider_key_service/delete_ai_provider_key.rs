use crate::adapters::db::{repositories, sqlite};

pub async fn delete_ai_provider_key(id: String) -> Result<(), String> {
    let pool = sqlite::get_db_pool()?;
    repositories::ai_provider_key::delete_ai_provider_key(pool, &id).await
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
    async fn test_delete_ai_provider_key_success() {
        setup_test_providers().await;

        // Create a key
        let created = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "Test Key".to_string(),
            "api-key-123".to_string(),
        )
        .await
        .expect("Failed to create key");

        // Delete it
        let result = delete_ai_provider_key(created.id.clone()).await;
        assert!(result.is_ok());

        // Verify it's gone
        let get_result = ai_provider_key_service::get_ai_provider_key(created.id).await;
        assert!(get_result.is_ok());
        assert!(get_result.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_delete_ai_provider_key_nonexistent() {
        setup_test_providers().await;

        // Delete non-existent key should succeed (idempotent)
        let result = delete_ai_provider_key("nonexistent-id".to_string()).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_delete_ai_provider_key_idempotent() {
        setup_test_providers().await;

        // Create and delete
        let created = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "Test Key".to_string(),
            "api-key-123".to_string(),
        )
        .await
        .expect("Failed to create key");

        let first_delete = delete_ai_provider_key(created.id.clone()).await;
        assert!(first_delete.is_ok());

        // Delete again - should still succeed
        let second_delete = delete_ai_provider_key(created.id).await;
        assert!(second_delete.is_ok());
    }

    #[tokio::test]
    async fn test_delete_ai_provider_key_does_not_affect_others() {
        setup_test_providers().await;

        // Create two keys
        let key1 = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "Key 1".to_string(),
            "key-1".to_string(),
        )
        .await
        .expect("Failed to create key 1");

        let key2 = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "Key 2".to_string(),
            "key-2".to_string(),
        )
        .await
        .expect("Failed to create key 2");

        // Delete first key
        let result = delete_ai_provider_key(key1.id.clone()).await;
        assert!(result.is_ok());

        // Verify first is gone
        let get1 = ai_provider_key_service::get_ai_provider_key(key1.id).await;
        assert!(get1.unwrap().is_none());

        // Verify second still exists
        let get2 = ai_provider_key_service::get_ai_provider_key(key2.id).await;
        assert!(get2.unwrap().is_some());
    }

    #[tokio::test]
    async fn test_delete_ai_provider_key_empty_id() {
        setup_test_providers().await;

        // Deleting with empty ID should succeed (no-op)
        let result = delete_ai_provider_key("".to_string()).await;
        assert!(result.is_ok());
    }
}
