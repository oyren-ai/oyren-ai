/**
 * AI API module - Centralized AI-related Tauri commands
 */

import { invoke } from '@tauri-apps/api/core';
import type { AIChatRequestBody, AIChatResponse, AiConnectionTestRequest } from './types/ai';

// Re-export types for convenience
export type { AIChatRequestBody, AIChatResponse, AiConnectionTestRequest };

export const aiApi = {
  //TODO: create request object and incapsulate the AIChatRequestBody
  chat: async (request: AIChatRequestBody, apiKey: string, requestId: string): Promise<AIChatResponse> => {
    return await invoke('ai_chat', { request, apiKey, requestId });
  },

  //TODO: create response type for these functions
  testConnection: async (params: AiConnectionTestRequest): Promise<boolean> => {
    return await invoke('test_gemini_connection', { ...params });
  }
};