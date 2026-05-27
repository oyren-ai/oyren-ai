use crate::adapters::db::models::AiProviderModel;
use sqlx::SqlitePool;

pub async fn get_ai_provider_model_by_id(
    pool: &SqlitePool,
    id: &str,
) -> Result<Option<AiProviderModel>, String> {
    sqlx::query_as::<_, AiProviderModel>(
        r#"SELECT id, provider_id, model_name, is_multimodal, is_active,
           metadata, created_at, updated_at
           FROM ai_provider_models WHERE id = ?"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to get AI provider model: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::repositories::ai_provider_model::seed_ai_provider_models;
    use crate::adapters::db::test_utils::setup_test_db;
    use crate::config::ai_seed_models::SeedModel;

    async fn insert_provider(pool: &SqlitePool) {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("INSERT OR IGNORE INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("gemini")
            .bind("gemini")
            .bind(&now)
            .execute(pool)
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn test_get_by_id_found() {
        let (pool, _dir) = setup_test_db().await;
        insert_provider(&pool).await;

        let models = vec![SeedModel {
            id: "models/gemini-2.5-flash".to_string(),
            provider_id: "gemini".to_string(),
            model_name: "Gemini 2.5 Flash".to_string(),
            is_multimodal: true,
            metadata: None,
        }];
        seed_ai_provider_models(&pool, models).await.unwrap();

        let result = get_ai_provider_model_by_id(&pool, "models/gemini-2.5-flash").await;
        assert!(result.is_ok());

        let model = result.unwrap().expect("Model should exist");
        assert_eq!(model.id, "models/gemini-2.5-flash");
        assert_eq!(model.model_name, "Gemini 2.5 Flash");
        assert_eq!(model.provider_id, "gemini");
        assert!(model.is_multimodal);
        assert!(!model.is_active);
    }

    #[tokio::test]
    async fn test_get_by_id_not_found() {
        let (pool, _dir) = setup_test_db().await;
        let result = get_ai_provider_model_by_id(&pool, "nonexistent").await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }
}