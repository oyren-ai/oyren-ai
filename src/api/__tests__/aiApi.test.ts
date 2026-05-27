import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiApi } from '../aiApi';
import type { AIChatRequestBody, AIChatResponse } from '../aiApi';

// Mock the Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('aiApi', () => {
  let mockInvoke: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { invoke } = vi.mocked(await import('@tauri-apps/api/core'));
    mockInvoke = invoke as ReturnType<typeof vi.fn>;
  });

  describe('aiApi.chat', () => {
    const mockRequest: AIChatRequestBody = {
      message: 'Test message',
      images: [
        { data: 'base64data', mime_type: 'image/png' }
      ],
      conversation_history: [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' }
      ],
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      max_tokens: 1000,
      provider: 'gemini'
    };

    const mockApiKey = 'test-api-key';
    const mockRequestId = 'test-request-id';

    it('should send chat request with correct parameters', async () => {
      const mockResponse: AIChatResponse = {
        response: 'Test AI response',
        model_used: 'gemini-2.5-flash',
        usage_metadata: {
          input_tokens: 100,
          output_tokens: 50,
          total_tokens: 150
        }
      };

      mockInvoke.mockResolvedValueOnce(mockResponse);

      const result = await aiApi.chat(mockRequest, mockApiKey, mockRequestId);

      expect(mockInvoke).toHaveBeenCalledWith('ai_chat', {
        request: mockRequest,
        apiKey: mockApiKey,
        requestId: mockRequestId
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle chat request without optional fields', async () => {
      const minimalRequest: AIChatRequestBody = {
        message: 'Simple message',
        images: [],
        conversation_history: [],
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        max_tokens: 1000,
        provider: 'gemini'
      };

      const mockResponse: AIChatResponse = {
        response: 'Simple response'
      };

      mockInvoke.mockResolvedValueOnce(mockResponse);

      const result = await aiApi.chat(minimalRequest, mockApiKey, mockRequestId);

      expect(mockInvoke).toHaveBeenCalledWith('ai_chat', {
        request: minimalRequest,
        apiKey: mockApiKey,
        requestId: mockRequestId
      });
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('Network error');
      mockInvoke.mockRejectedValueOnce(error);

      await expect(aiApi.chat(mockRequest, mockApiKey, mockRequestId)).rejects.toThrow('Network error');
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it('should handle empty API key', async () => {
      const mockResponse: AIChatResponse = {
        response: 'Response with empty key'
      };

      mockInvoke.mockResolvedValueOnce(mockResponse);

      const result = await aiApi.chat(mockRequest, '', mockRequestId);

      expect(mockInvoke).toHaveBeenCalledWith('ai_chat', {
        request: mockRequest,
        apiKey: '',
        requestId: mockRequestId
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('aiApi.testConnection', () => {
    const mockParams = {
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 1000,
      apiKey: 'test-api-key'
    };

    it('should test connection with correct parameters', async () => {
      mockInvoke.mockResolvedValueOnce(true);

      const result = await aiApi.testConnection(mockParams);

      expect(mockInvoke).toHaveBeenCalledWith('test_gemini_connection', mockParams);
      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      mockInvoke.mockResolvedValueOnce(false);

      const result = await aiApi.testConnection(mockParams);

      expect(mockInvoke).toHaveBeenCalledWith('test_gemini_connection', mockParams);
      expect(result).toBe(false);
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('Connection test failed');
      mockInvoke.mockRejectedValueOnce(error);

      await expect(aiApi.testConnection(mockParams)).rejects.toThrow('Connection test failed');
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('aiApi object', () => {
    it('should expose chat function', () => {
      expect(aiApi.chat).toBeDefined();
      expect(typeof aiApi.chat).toBe('function');
    });

    it('should expose testConnection function', () => {
      expect(aiApi.testConnection).toBeDefined();
      expect(typeof aiApi.testConnection).toBe('function');
    });

    it('should call the same functions as standalone exports', async () => {
      const mockResponse: AIChatResponse = {
        response: 'Test response'
      };
      mockInvoke.mockResolvedValueOnce(mockResponse);

      const request: AIChatRequestBody = {
        message: 'Test',
        images: [],
        conversation_history: [],
        model: 'test-model',
        temperature: 0.5,
        max_tokens: 500,
        provider: 'test-provider'
      };

      const requestId = 'standalone-request-id';
      const result = await aiApi.chat(request, 'api-key', requestId);

      expect(mockInvoke).toHaveBeenCalledWith('ai_chat', {
        request,
        apiKey: 'api-key',
        requestId
      });
      expect(result).toEqual(mockResponse);
    });
  });
});