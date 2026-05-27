export interface ConfigResponse {
  message: string;
  provider: string;
  apiKeyPrefix: string;
  model: string;
  conversationHistoryLength: number;
  temperature: number;
  maxTokens: number;
}