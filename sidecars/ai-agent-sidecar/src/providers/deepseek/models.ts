/**
 * DeepSeek model names matching the hardcoded list in Rust (ai_models.rs)
 * These are the supported DeepSeek models in the application
 */
export const DEEPSEEK_MODELS = [
  "deepseek-chat",
  "deepseek-reasoner",
] as const;

/**
 * Default DeepSeek model (matches Rust default)
 */
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat" as const;