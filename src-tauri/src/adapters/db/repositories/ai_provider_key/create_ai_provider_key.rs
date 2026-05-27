use crate::adapters::db::models::{AiProvider, AiProviderKey, CreateAiProviderKeyRequest};
use crate::adapters::db::repositories::ai_provider_model::get_models_for_provider_as_dto;
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn create_ai_provider_key(
    pool: &SqlitePool,
    request: CreateAiProviderKeyRequest,
) -> Result<AiProviderKey, String> {
    let id = Uuid::new_v4().to_string();
    let date_added = Utc::now();

    sqlx::query(
        r#"
        INSERT INTO ai_provider_keys (id, provider_id, name, key, date_added, last_used_date)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&request.provider_id)
    .bind(&request.name)
    .bind(&request.key)
    .bind(date_added.to_rfc3339())
    .bind(None::<String>)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create AI provider key: {}", e))?;

    let provider = sqlx::query_as::<_, (String, String, String)>(
        "SELECT id, name, created_at FROM ai_providers WHERE id = ?",
    )
    .bind(&request.provider_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to fetch provider: {}", e))?;

    let models = get_models_for_provider_as_dto(pool, &request.provider_id).await?;

    Ok(AiProviderKey {
        id,
        ai_provider: AiProvider {
            id: provider.0.clone(),
            name: provider.1.clone(),
            created_at: provider
                .2
                .parse()
                .map_err(|e| format!("Failed to parse date: {}", e))?,
        },
        name: request.name,
        key: request.key,
        date_added,
        last_used_date: None,
        is_local: false,
        models,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
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

        sqlx::query("INSERT INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("deepseek")
            .bind("deepseek")
            .bind(&now)
            .execute(&pool)
            .await
            .expect("Failed to insert deepseek provider");

        (pool, temp_dir)
    }

    #[tokio::test]
    async fn test_create_ai_provider_key_success() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let request = CreateAiProviderKeyRequest {
            provider_id: "gemini".to_string(),
            name: "My Gemini Key".to_string(),
            key: "test-key-123".to_string(),
        };

        let result = create_ai_provider_key(&pool, request).await;
        assert!(result.is_ok());

        let created = result.unwrap();
        assert!(!created.id.is_empty());
        assert_eq!(created.ai_provider.name, "gemini");
        assert_eq!(created.name, "My Gemini Key");
        assert_eq!(created.key, "test-key-123");
        assert!(created.last_used_date.is_none());
    }

    #[tokio::test]
    async fn test_create_ai_provider_key_invalid_provider() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let request = CreateAiProviderKeyRequest {
            provider_id: "invalid-provider".to_string(),
            name: "Invalid Key".to_string(),
            key: "test-key".to_string(),
        };

        let result = create_ai_provider_key(&pool, request).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_multiple_keys_for_same_provider() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let request1 = CreateAiProviderKeyRequest {
            provider_id: "gemini".to_string(),
            name: "Key 1".to_string(),
            key: "key-1".to_string(),
        };
        let result1 = create_ai_provider_key(&pool, request1).await;
        assert!(result1.is_ok());

        let request2 = CreateAiProviderKeyRequest {
            provider_id: "gemini".to_string(),
            name: "Key 2".to_string(),
            key: "key-2".to_string(),
        };
        let result2 = create_ai_provider_key(&pool, request2).await;
        assert!(result2.is_ok());

        let created1 = result1.unwrap();
        let created2 = result2.unwrap();
        assert_ne!(created1.id, created2.id);
    }
}
