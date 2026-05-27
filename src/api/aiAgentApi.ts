/**
 * AI Agent API module - Centralized AI agent sidecar commands
 */

import { invoke } from '@tauri-apps/api/core';
import type { OllamaModel } from './types/ai';

export interface TestConnectionResponse {
  success: boolean;
  provider: string;
  model: string;
  message: string;
}

export const aiAgentApi = {
  /**
   * Send a message to the AI agent sidecar
   * @param message - The message to send to the agent
   * @returns The agent's response (currently "hello world" for POC)
   */
  chat: async (message: string): Promise<string> => {
    return await invoke('ai_agent_chat', { message });
  },

  /**
   * Detect available Ollama models on the host machine
   * @returns Array of available Ollama models
   */
  detectOllamaModels: async (): Promise<OllamaModel[]> => {
    return await invoke('ai_agent_detect_models');
  },

  /**
   * Test connection to an AI provider
   * @param provider - The AI provider name (e.g., 'gemini', 'deepseek')
   * @param apiKey - The API key for the provider
   * @param model - The model to test (e.g., 'models/gemini-2.5-flash')
   * @returns Connection test result
   */
  testConnection: async (
    provider: string,
    apiKey: string,
    model: string
  ): Promise<TestConnectionResponse> => {
    return await invoke('ai_agent_test_connection', {
      request: { provider, api_key: apiKey, model }
    });
  },
};