use crate::adapters::db::models::AiModel;
use sqlx::SqlitePool;

pub async fn get_models_for_provider_as_dto(
    pool: &SqlitePool,
    provider_id: &str,
) -> Result<Vec<AiModel>, String> {
    let rows = sqlx::query_as::<_, (String, String, String, bool)>(
        r#"SELECT id, model_name, provider_id, is_active
           FROM ai_provider_models WHERE provider_id = ?
           ORDER BY model_name"#,
    )
    .bind(provider_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to get models for provider '{}': {}", provider_id, e))?;

    Ok(rows
        .into_iter()
        .map(|(id, model_name, provider_id, is_active)| AiModel {
            id,
            name: model_name,
            provider: provider_id,
            enabled: is_active,
        })
        .collect())
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
    async fn test_maps_to_ai_model_dto() {
        let (pool, _dir) = setup_test_db().await;
        insert_provider(&pool, "gemini").await;

        let models = vec![seed("m1", "gemini", "Flash")];
        seed_ai_provider_models(&pool, models).await.unwrap();

        let result = get_models_for_provider_as_dto(&pool, "gemini")
            .await
            .unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].id, "m1");
        assert_eq!(result[0].name, "Flash");
        assert_eq!(result[0].provider, "gemini");
        assert!(!result[0].enabled);
    }

    #[tokio::test]
    async fn test_returns_empty_for_unknown() {
        let (pool, _dir) = setup_test_db().await;
        let result = get_models_for_provider_as_dto(&pool, "nope")
            .await
            .unwrap();
        assert!(result.is_empty());
    }
}
