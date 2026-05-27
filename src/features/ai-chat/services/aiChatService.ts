import {aiAgentApi} from '@/api/aiAgentApi';

export interface AIChatMessage {
  role: string;
  parts?: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>;
  content?: string; // For DeepSeek format
}

class AIChatService {
    //TODO: why is this unused
  private currentProvider: string = 'gemini';
  private currentModel: string = 'gemini-2.5-flash';
  private temperature: number = 0.7;

  updateConfig(provider: string, model: string, temperature: number) {
    this.currentProvider = provider;
    this.currentModel = model;
    this.temperature = temperature;
  }

  async sendMessage(
    message: string,
  ): Promise<string> {
    // POC: Route to AI agent sidecar (returns "hello world")
    try {
      return await aiAgentApi.chat(message);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const apiKey = localStorage.getItem('ai-api-key');
    if (!apiKey) {
      return { success: false, error: 'No API key configured' };
    }

    try {
      // Send a simple test message
      await this.sendMessage('Hello, this is a test message. Please respond briefly.');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  getDefaultModel(provider: string): string {
    switch (provider) {
      case 'gemini':
        return 'gemini-2.5-flash';
      case 'deepseek':
        return 'deepseek-chat';
      default:
        return 'gemini-2.5-flash';
    }
  }

  getAvailableModels(provider: string): string[] {
    switch (provider) {
      case 'gemini':
        return [
          'gemini-2.5-flash',
          'gemini-2.5-pro',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-1.5-pro',
        ];
      case 'deepseek':
        return [
          'deepseek-chat',
          'deepseek-coder',
        ];
      default:
        return [];
    }
  }
}

export const aiChatService = new AIChatService();