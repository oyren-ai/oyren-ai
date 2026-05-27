use crate::adapters::db::models::{AiProvider, AiProviderKey};
use crate::adapters::db::repositories::ai_provider_model::get_models_for_provider_as_dto;
use sqlx::SqlitePool;

pub async fn get_ai_provider_key(
    pool: &SqlitePool,
    id: &str,
) -> Result<Option<AiProviderKey>, String> {
    let result = sqlx::query_as::<
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
        WHERE apk.id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to get AI provider key: {}", e))?;

    match result {
        Some((
            id,
            provider_id,
            name,
            key,
            date_added,
            last_used_date,
            provider_name,
            provider_created_at,
        )) => {
            let models = get_models_for_provider_as_dto(pool, &provider_id).await?;

            Ok(Some(AiProviderKey {
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
            }))
        }
        None => Ok(None),
    }
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
    async fn test_get_ai_provider_key_found() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let request = CreateAiProviderKeyRequest {
            provider_id: "gemini".to_string(),
            name: "Test Name".to_string(),
            key: "test-api-key-123".to_string(),
        };
        let created = create_ai_provider_key(&pool, request).await.unwrap();

        let result = get_ai_provider_key(&pool, &created.id).await;
        assert!(result.is_ok());

        let found = result.unwrap();
        assert!(found.is_some());

        let key_data = found.unwrap();
        assert_eq!(key_data.id, created.id);
        assert_eq!(key_data.key, created.key);
        assert_eq!(key_data.ai_provider.name, "gemini");
    }

    #[tokio::test]
    async fn test_get_ai_provider_key_not_found() {
        let (pool, _temp_dir) = setup_db_with_providers().await;

        let result = get_ai_provider_key(&pool, "nonexistent-id").await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }
}
