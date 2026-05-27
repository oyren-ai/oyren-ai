use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeedModel {
    pub id: String,
    pub provider_id: String,
    pub model_name: String,
    pub is_multimodal: bool,
    pub metadata: Option<String>,
}

pub fn get_all_seed_models() -> Vec<SeedModel> {
    let mut models = Vec::new();
    models.extend(gemini_models());
    models.extend(deepseek_models());
    models.extend(openrouter_models());
    models
}

fn gemini_models() -> Vec<SeedModel> {
    vec![
        seed("models/gemini-2.5-flash-lite", "gemini", "Gemini 2.5 Flash Lite", false),
        seed("models/gemini-2.5-flash", "gemini", "Gemini 2.5 Flash", true),
        seed("models/gemini-2.5-pro", "gemini", "Gemini 2.5 Pro", true),
        seed("models/gemini-3-pro-preview", "gemini", "Gemini 3 Pro Preview", true),
    ]
}

fn deepseek_models() -> Vec<SeedModel> {
    vec![
        seed("deepseek-chat", "deepseek", "DeepSeek Chat", false),
        seed("deepseek-reasoner", "deepseek", "DeepSeek Reasoner", false),
    ]
}

fn openrouter_models() -> Vec<SeedModel> {
    vec![
        seed("google/gemini-3-pro-preview", "openrouter", "Gemini 3 Pro Preview", true),
        seed("google/gemini-3-flash-preview", "openrouter", "Gemini 3 Flash Preview", true),
        seed("google/gemini-2.5-pro-preview", "openrouter", "Gemini 2.5 Pro Preview", true),
        seed("google/gemini-2.5-flash", "openrouter", "Gemini 2.5 Flash", true),
        seed("anthropic/claude-opus-4.6", "openrouter", "Claude Opus 4.6", true),
        seed("anthropic/claude-sonnet-4.6", "openrouter", "Claude Sonnet 4.6", true),
        seed("anthropic/claude-opus-4.5", "openrouter", "Claude Opus 4.5", true),
        seed("anthropic/claude-sonnet-4.5", "openrouter", "Claude Sonnet 4.5", true),
        seed("anthropic/claude-haiku-4.5", "openrouter", "Claude Haiku 4.5", true),
        seed("openai/gpt-5.2", "openrouter", "GPT-5.2", true),
        seed("openai/gpt-5", "openrouter", "GPT-5", true),
        seed("openai/gpt-5-mini", "openrouter", "GPT-5 Mini", true),
        seed("openai/gpt-4.1", "openrouter", "GPT-4.1", true),
        seed("openai/gpt-4.1-mini", "openrouter", "GPT-4.1 Mini", true),
        seed("openai/gpt-4o", "openrouter", "GPT-4o", true),
        seed("openai/gpt-4o-mini", "openrouter", "GPT-4o Mini", true),
        seed("moonshotai/kimi-k2.5", "openrouter", "Kimi K2.5", false),
        seed("deepseek/deepseek-v3.2", "openrouter", "DeepSeek V3.2", false),
        seed("z-ai/glm-5", "openrouter", "GLM-5", false),
    ]
}

fn seed(id: &str, provider_id: &str, model_name: &str, is_multimodal: bool) -> SeedModel {
    SeedModel {
        id: id.to_string(),
        provider_id: provider_id.to_string(),
        model_name: model_name.to_string(),
        is_multimodal,
        metadata: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_all_seed_models_returns_all_providers() {
        let models = get_all_seed_models();
        let providers: Vec<&str> = models.iter().map(|m| m.provider_id.as_str()).collect();
        assert!(providers.contains(&"gemini"));
        assert!(providers.contains(&"deepseek"));
        assert!(providers.contains(&"openrouter"));
    }

    #[test]
    fn test_get_all_seed_models_has_unique_ids() {
        let models = get_all_seed_models();
        let mut ids: Vec<&str> = models.iter().map(|m| m.id.as_str()).collect();
        let total = ids.len();
        ids.sort();
        ids.dedup();
        assert_eq!(ids.len(), total, "Seed model IDs must be unique");
    }

    #[test]
    fn test_gemini_models_count() {
        let models = gemini_models();
        assert_eq!(models.len(), 4);
    }

    #[test]
    fn test_deepseek_models_count() {
        let models = deepseek_models();
        assert_eq!(models.len(), 2);
    }

    #[test]
    fn test_seed_model_fields() {
        let model = seed("test-id", "test-provider", "Test Model", true);
        assert_eq!(model.id, "test-id");
        assert_eq!(model.provider_id, "test-provider");
        assert_eq!(model.model_name, "Test Model");
        assert!(model.is_multimodal);
        assert!(model.metadata.is_none());
    }
}
