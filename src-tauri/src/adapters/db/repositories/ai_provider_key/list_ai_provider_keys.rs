use crate::adapters::db::models::{AiProvider, AiProviderKey};
use crate::adapters::db::repositories::ai_provider_model::get_models_for_provider_as_dto;
use sqlx::SqlitePool;

pub async fn list_ai_provider_keys(pool: &SqlitePool) -> Result<Vec<AiProviderKey>, String> {
    let results = sqlx::query_as::<
        _,
        (
            String,
            String,
            String,
            String,
            String,
            Option<String>,
            String,
            String,
        ),
    >(
        r#"
        SELECT
            apk.id,
            apk.provider_id,
            apk.name,
            apk.key,
            apk.date_added,
            apk.last_used_date,
            ap.name as provider_name,
            ap.created_at as provider_created_at
        FROM ai_provider_keys apk
        INNER JOIN ai_providers ap ON apk.provider_id = ap.id
        ORDER BY apk.date_added DESC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list AI provider keys: {}", e))?;

    let mut keys = Vec::with_capacity(results.len());
    for (id, provider_id, name, key, date_added, last_used_date, provider_name, provider_created_at) in results {
        let models = get_models_for_provider_as_dto(pool, &provider_id).await?;

        keys.push(AiProviderKey {
            id,
            ai_provider: AiProvider {
                id: provider_id,
                name: provider_name,
                created_at: provider_created_at
                    .parse()
                    .map_err(|e| format!("Failed to parse date: {}", e))?,
            },
            name,
            key,
            date_added: date_added
                .parse()
                .map_err(|e| format!("Failed to parse date: {}", e))?,
            last_used_date: last_used_date
                .map(|d| d.parse())
                .transpose()
                .map_err(|e| format!("Failed to parse last_used_date: {}", e))?,
            is_local: false,
            models,
        });
    }
    Ok(keys)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adapters::db::models::CreateAiProviderKeyRequest;
    use crate::adapters::db::repositories::ai_provider_key::create_ai_provider_key;
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

        sqlx::query("INSERT INTO ai_providers (id, name, created_at) VALUES (?, ?, ?)")
            .bind("openrouter")
            .bind("openrouter")
            .bind(&now)
            .execute(&pool)
            .await
            .expect("Failed to insert openrouter provider");

        (pool, temp_dir)
    }

    #[tokio::test]
    async fn test_list_ai_provider_keys_empty() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let result = list_ai_provider_keys(&pool).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }

    #[tokio::test]
    async fn test_list_ai_provider_keys_multiple() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let request1 = CreateAiProviderKeyRequest {
            provider_id: "gemini".to_string(),
            name: "Test Name 1".to_string(),
            key: "gemini-key-123".to_string(),
        };
        create_ai_provider_key(&pool, request1).await.unwrap();

        let request2 = CreateAiProviderKeyRequest {
            provider_id: "deepseek".to_string(),
            name: "Test Name 2".to_string(),
            key: "deepseek-key-456".to_string(),
        };
        create_ai_provider_key(&pool, request2).await.unwrap();

        let result = list_ai_provider_keys(&pool).await;
        assert!(result.is_ok());

        let keys = result.unwrap();
        assert_eq!(keys.len(), 2);
        assert!(keys.iter().any(|k| k.ai_provider.name == "gemini"));
        assert!(keys.iter().any(|k| k.ai_provider.name == "deepseek"));
    }
}
