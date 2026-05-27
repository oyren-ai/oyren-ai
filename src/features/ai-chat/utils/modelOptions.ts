import type { AiModel } from '@/types/aiProviderKey';

export interface ModelOption {
  value: string;
  label: string;
  color: string;
  description?: string;
}

const colorMap: Record<string, string> = {
  'deepseek-chat': 'bg-orange-500',
  'deepseek-coder': 'bg-orange-600',
  'gemini-2.5-flash': 'bg-blue-500',
  'gemini-2.5-pro': 'bg-purple-500',
  'gemini-2.5-flash-lite': 'bg-green-500',
  'gemini-2.0-flash': 'bg-teal-500',
  'gemini-live-2.5-flash-preview': 'bg-indigo-500',
  'openrouter': 'bg-pink-500',
  // OpenRouter - Google Gemini
  'google/gemini-3-pro-preview': 'bg-blue-600',
  'google/gemini-3-flash-preview': 'bg-blue-500',
  'google/gemini-2.5-pro-preview': 'bg-blue-700',
  'google/gemini-2.5-flash': 'bg-blue-400',
  // OpenRouter - Anthropic Claude
  'anthropic/claude-opus-4.6': 'bg-purple-800',
  'anthropic/claude-sonnet-4.6': 'bg-violet-600',
  'anthropic/claude-opus-4.5': 'bg-purple-700',
  'anthropic/claude-sonnet-4.5': 'bg-purple-600',
  'anthropic/claude-haiku-4.5': 'bg-purple-500',
  // OpenRouter - OpenAI GPT
  'openai/gpt-5.2': 'bg-green-700',
  'openai/gpt-5.2-mini': 'bg-green-600',
  'openai/gpt-5': 'bg-green-800',
  'openai/gpt-5-mini': 'bg-green-500',
  'openai/gpt-4.1': 'bg-emerald-700',
  'openai/gpt-4.1-mini': 'bg-emerald-600',
  'openai/gpt-4o': 'bg-emerald-800',
  'openai/gpt-4o-mini': 'bg-emerald-500',
  // Moonshot AI
  'moonshotai/kimi-k2.5': 'bg-cyan-600',
  // DeepSeek
  'deepseek/deepseek-v3.2': 'bg-orange-700',
  // Z.ai
  'z-ai/glm-5': 'bg-red-600',
};

export function getModelOptionsFromModels(models: AiModel[]): ModelOption[] {
  return models.map(model => ({
    value: model.id,
    label: model.name,
    color: colorMap[model.id] || 'bg-gray-500',
    description: undefined,
  }));
}

export function getDefaultModelFromModels(models: AiModel[]): string {
  const defaultModel = models.find(m => m.enabled) || models[0];
  return defaultModel?.id || '';
}
