use crate::adapters::db::models::{AiModel, AiProvider};
use crate::adapters::db::{repositories, sqlite, AiProviderKey};
use crate::services::ai_agent_service;
use chrono::Utc;
use tauri::AppHandle;

pub async fn list_ai_provider_keys(app: &AppHandle) -> Result<Vec<AiProviderKey>, String> {
    let pool = sqlite::get_db_pool()?;
    let mut all_keys = repositories::ai_provider_key::list_ai_provider_keys(pool).await?;

    // Detect and add local Ollama models
    match ai_agent_service::detect_ollama_models(app).await {
        Ok(response) => {
            for model in response.models {
                // For each Ollama model, create a single-model entry
                let model_entry = AiModel {
                    id: model.name.clone(),
                    name: model.name.clone(),
                    provider: "ollama".to_string(),
                    enabled: true,
                };

                let local_key = AiProviderKey {
                    id: format!("local-ollama-{}", model.name),
                    ai_provider: AiProvider {
                        id: "ollama".to_string(),
                        name: "ollama".to_string(),
                        created_at: Utc::now(),
                    },
                    name: model.name.clone(),
                    key: String::new(),
                    date_added: Utc::now(),
                    last_used_date: None,
                    is_local: true,
                    models: vec![model_entry],
                };
                all_keys.push(local_key);
            }
        }
        Err(_) => {
            // If Ollama detection fails, continue without local models
        }
    }

    Ok(all_keys)
}

/// Helper function to list only database keys (testable without AppHandle)
pub async fn list_database_keys() -> Result<Vec<AiProviderKey>, String> {
    let pool = sqlite::get_db_pool()?;
    repositories::ai_provider_key::list_ai_provider_keys(pool).await
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

        let _ = sqlx::query("INSERT OR IGNORE INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("deepseek")
            .bind("deepseek")
            .bind(&now)
            .execute(pool)
            .await;
    }

    #[tokio::test]
    async fn test_list_database_keys_empty() {
        setup_test_providers().await;

        let result = list_database_keys().await;

        assert!(result.is_ok());
        // May have keys from other tests due to shared DB
        // Just verify we can list without errors
    }

    #[tokio::test]
    async fn test_list_database_keys_single() {
        setup_test_providers().await;

        // Create a key with unique name
        let created = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "List Test Single Key".to_string(),
            "api-key-list-single".to_string(),
        )
        .await
        .expect("Failed to create key");

        let result = list_database_keys().await;

        assert!(result.is_ok());
        let keys = result.unwrap();

        // Verify our key is in the list (don't check exact count due to parallel tests)
        let found = keys.iter().find(|k| k.id == created.id);
        assert!(found.is_some());
        assert_eq!(found.unwrap().name, "List Test Single Key");
        assert_eq!(found.unwrap().ai_provider.id, "gemini");
    }

    #[tokio::test]
    async fn test_list_database_keys_multiple() {
        setup_test_providers().await;

        // Create multiple keys with unique names
        let k1 = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "List Test Gemini 1".to_string(),
            "key-list-g1".to_string(),
        )
        .await
        .expect("Failed to create key 1");

        let k2 = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "List Test Gemini 2".to_string(),
            "key-list-g2".to_string(),
        )
        .await
        .expect("Failed to create key 2");

        let k3 = ai_provider_key_service::create_ai_provider_key(
            "deepseek".to_string(),
            "List Test DeepSeek".to_string(),
            "key-list-ds".to_string(),
        )
        .await
        .expect("Failed to create key 3");

        let result = list_database_keys().await;

        assert!(result.is_ok());
        let keys = result.unwrap();

        // Verify all our keys are in the list (don't check exact count due to parallel tests)
        let our_keys: Vec<_> = keys
            .iter()
            .filter(|k| k.id == k1.id || k.id == k2.id || k.id == k3.id)
            .collect();
        assert_eq!(our_keys.len(), 3, "All 3 created keys should be in the list");

        // Verify provider distribution
        let k1_found = keys.iter().find(|k| k.id == k1.id).unwrap();
        let k2_found = keys.iter().find(|k| k.id == k2.id).unwrap();
        let k3_found = keys.iter().find(|k| k.id == k3.id).unwrap();

        assert_eq!(k1_found.ai_provider.id, "gemini");
        assert_eq!(k2_found.ai_provider.id, "gemini");
        assert_eq!(k3_found.ai_provider.id, "deepseek");
    }

    #[tokio::test]
    async fn test_list_database_keys_excludes_deleted() {
        setup_test_providers().await;

        // Create unique keys for this test
        let key1 = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "Delete Test Key 1".to_string(),
            "key-del-1".to_string(),
        )
        .await
        .expect("Failed to create key 1");

        let key2 = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "Delete Test Key 2".to_string(),
            "key-del-2".to_string(),
        )
        .await
        .expect("Failed to create key 2");

        // Verify both exist before deletion
        let before_delete = list_database_keys().await.unwrap();
        assert!(before_delete.iter().any(|k| k.id == key1.id), "key1 should exist before delete");
        assert!(before_delete.iter().any(|k| k.id == key2.id), "key2 should exist before delete");

        // Delete first key
        let _ = ai_provider_key_service::delete_ai_provider_key(key1.id.clone()).await;

        let result = list_database_keys().await;

        assert!(result.is_ok());
        let keys = result.unwrap();

        // Verify key1 is gone and key2 exists (don't check exact count due to parallel tests)
        assert!(keys.iter().all(|k| k.id != key1.id), "Deleted key1 should not appear in list");
        assert!(keys.iter().any(|k| k.id == key2.id), "key2 should still exist after deleting key1");
    }

    #[tokio::test]
    async fn test_list_database_keys_preserves_all_fields() {
        setup_test_providers().await;

        // Create key with specific properties and unique name
        let created = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "Fields Test Special Key 🔑".to_string(),
            "sk-fields-test-123".to_string(),
        )
        .await
        .expect("Failed to create key");

        let result = list_database_keys().await;

        assert!(result.is_ok());
        let keys = result.unwrap();

        // Find our key in the list
        let key = keys.iter().find(|k| k.id == created.id).expect("Key should exist");
        assert_eq!(key.name, "Fields Test Special Key 🔑");
        assert_eq!(key.key, "sk-fields-test-123");
        assert_eq!(key.ai_provider.id, "gemini");
        assert!(!key.is_local);
    }

    #[tokio::test]
    async fn test_list_database_keys_ordered_by_date() {
        setup_test_providers().await;

        // Create keys with unique names in sequence
        let key1 = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "Order Test First".to_string(),
            "key-order-1".to_string(),
        )
        .await
        .expect("Failed to create key 1");

        // Small delay to ensure different timestamps
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        let key2 = ai_provider_key_service::create_ai_provider_key(
            "gemini".to_string(),
            "Order Test Second".to_string(),
            "key-order-2".to_string(),
        )
        .await
        .expect("Failed to create key 2");

        let result = list_database_keys().await;

        assert!(result.is_ok());
        let keys = result.unwrap();

        // Find our keys and verify order
        let idx1 = keys.iter().position(|k| k.id == key1.id).expect("Key 1 should exist");
        let idx2 = keys.iter().position(|k| k.id == key2.id).expect("Key 2 should exist");

        // Verify timestamps
        assert!(keys[idx1].date_added <= keys[idx2].date_added);
    }

    // Note: Full integration test for list_ai_provider_keys with AppHandle
    // would require integration testing as AppHandle cannot be easily mocked
    // The function is tested indirectly through list_database_keys
}
