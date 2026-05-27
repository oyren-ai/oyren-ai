use crate::adapters::db::{models::AiProviderModel, repositories, sqlite};

pub async fn get_ai_provider_model_by_id(
    id: String,
) -> Result<Option<AiProviderModel>, String> {
    let pool = sqlite::get_db_pool()?;
    repositories::ai_provider_model::get_ai_provider_model_by_id(pool, &id).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::test_utils::init_test_db;
    use crate::adapters::db::{repositories, sqlite};
    use crate::config::ai_seed_models::SeedModel;

    async fn setup() {
        init_test_db().await;
        let pool = sqlite::get_db_pool().unwrap();
        let now = chrono::Utc::now().to_rfc3339();
        let _ = sqlx::query("INSERT OR IGNORE INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("svc-get-by-id")
            .bind("svc-get-by-id")
            .bind(&now)
            .execute(pool)
            .await;

        let models = vec![SeedModel {
            id: "test-svc-model".to_string(),
            provider_id: "svc-get-by-id".to_string(),
            model_name: "Test Svc Model".to_string(),
            is_multimodal: true,
            metadata: None,
        }];
        let _ = repositories::ai_provider_model::seed_ai_provider_models(pool, models).await;
    }

    #[tokio::test]
    async fn test_get_by_id_found() {
        setup().await;
        let result = get_ai_provider_model_by_id("test-svc-model".to_string()).await;
        assert!(result.is_ok());
        let model = result.unwrap().unwrap();
        assert_eq!(model.model_name, "Test Svc Model");
    }

    #[tokio::test]
    async fn test_get_by_id_not_found() {
        setup().await;
        let result = get_ai_provider_model_by_id("nope".to_string()).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }
}
