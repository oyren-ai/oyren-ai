use crate::adapters::db::{models::AiProviderModel, repositories, sqlite};

pub async fn update_ai_provider_model_active(
    id: String,
    is_active: bool,
) -> Result<AiProviderModel, String> {
    let pool = sqlite::get_db_pool()?;
    repositories::ai_provider_model::update_ai_provider_model_active(pool, &id, is_active).await
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
            .bind("svc-upd-active")
            .bind("svc-upd-active")
            .bind(&now)
            .execute(pool)
            .await;

        let models = vec![SeedModel {
            id: "svc-upd-m1".to_string(),
            provider_id: "svc-upd-active".to_string(),
            model_name: "Update Test".to_string(),
            is_multimodal: false,
            metadata: None,
        }];
        let _ = repositories::ai_provider_model::seed_ai_provider_models(pool, models).await;
    }

    #[tokio::test]
    async fn test_deactivate() {
        setup().await;
        let result = update_ai_provider_model_active("svc-upd-m1".to_string(), false).await;
        assert!(result.is_ok());
        assert!(!result.unwrap().is_active);
    }

    #[tokio::test]
    async fn test_not_found() {
        setup().await;
        let result = update_ai_provider_model_active("nope".to_string(), false).await;
        assert!(result.is_err());
    }
}