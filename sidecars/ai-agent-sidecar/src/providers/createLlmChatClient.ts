import type { LlmChatClient } from "@/types/LlmChatClient.ts";
import { AiProvider } from "@/types/AiProvider.ts";
import createGeminiClient from "@/providers/gemini/createGeminiClient.ts";
import createDeepSeekClient from "@/providers/deepseek/createDeepSeekClient.ts";
import createOpenRouterClient from "@/providers/openrouter/createOpenRouterClient.ts";
import createOllamaClient from "@/providers/ollama/createOllamaClient.ts";


export default function createLlmChatClient(
  aiProvider: AiProvider,
  model: string,
  temperature?: number,
  maxTokens?: number,
): LlmChatClient {

  const temp = temperature ?? 0.7;
  const tokens = maxTokens ?? 16384;

  switch (aiProvider.provider.toLowerCase()) {
    case "gemini":
      return createGeminiClient(aiProvider.apiKey, model, temp, tokens);
    case "deepseek":
      return createDeepSeekClient(aiProvider.apiKey, model, temp, tokens);
    case "openrouter":
      return createOpenRouterClient(aiProvider.apiKey, model, temp, tokens);
    case "ollama":
      return createOllamaClient(model, temp, tokens);
    default:
      throw new Error(`Unsupported provider: ${aiProvider.provider}`);
  }
}