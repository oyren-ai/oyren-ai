use crate::adapters::db::models::AiProviderModel;
use sqlx::SqlitePool;

pub async fn get_models_by_provider_id(
    pool: &SqlitePool,
    provider_id: &str,
) -> Result<Vec<AiProviderModel>, String> {
    sqlx::query_as::<_, AiProviderModel>(
        r#"SELECT id, provider_id, model_name, is_multimodal, is_active,
           metadata, created_at, updated_at
           FROM ai_provider_models WHERE provider_id = ?
           ORDER BY model_name"#,
    )
    .bind(provider_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to get models for provider '{}': {}", provider_id, e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::repositories::ai_provider_model::seed_ai_provider_models;
    use crate::adapters::db::test_utils::setup_test_db;
    use crate::config::ai_seed_models::SeedModel;

    async fn insert_provider(pool: &SqlitePool, id: &str) {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("INSERT OR IGNORE INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind(id)
            .bind(id)
            .bind(&now)
            .execute(pool)
            .await
            .unwrap();
    }

    fn seed(id: &str, provider: &str, name: &str) -> SeedModel {
        SeedModel {
            id: id.to_string(),
            provider_id: provider.to_string(),
            model_name: name.to_string(),
            is_multimodal: false,
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_returns_matching_models() {
        let (pool, _dir) = setup_test_db().await;
        insert_provider(&pool, "gemini").await;
        insert_provider(&pool, "deepseek").await;

        let models = vec![
            seed("m1", "gemini", "Model A"),
            seed("m2", "gemini", "Model B"),
            seed("m3", "deepseek", "Model C"),
        ];
        seed_ai_provider_models(&pool, models).await.unwrap();

        let result = get_models_by_provider_id(&pool, "gemini").await.unwrap();
        assert_eq!(result.len(), 2);
        assert!(result.iter().all(|m| m.provider_id == "gemini"));
    }

    #[tokio::test]
    async fn test_returns_empty_for_unknown_provider() {
        let (pool, _dir) = setup_test_db().await;
        let result = get_models_by_provider_id(&pool, "unknown").await.unwrap();
        assert!(result.is_empty());
    }

    #[tokio::test]
    async fn test_ordered_by_name() {
        let (pool, _dir) = setup_test_db().await;
        insert_provider(&pool, "gemini").await;

        let models = vec![
            seed("m2", "gemini", "Zebra Model"),
            seed("m1", "gemini", "Alpha Model"),
        ];
        seed_ai_provider_models(&pool, models).await.unwrap();

        let result = get_models_by_provider_id(&pool, "gemini").await.unwrap();
        assert_eq!(result[0].model_name, "Alpha Model");
        assert_eq!(result[1].model_name, "Zebra Model");
    }
}