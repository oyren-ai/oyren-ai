import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSendMessageCallback } from './createSendMessageCallback';
import type { SendMessageRequest, SendMessageDependencies } from './createSendMessageCallback';
import type { ChatMessage } from '../../types';
import { aiApi } from '@/api/aiApi';

// Mock aiApi
vi.mock('@/api/aiApi', () => ({
  aiApi: {
    chat: vi.fn()
  }
}));

// Mock messageFactory
vi.mock('../messageFactory', () => ({
  createUserMessage: vi.fn((content, images, files, fullContent) => ({
    id: 'user-1',
    type: 'user',
    content,
    images,
    files,
    timestamp: new Date(),
    messageTextWithFileContentsSentToAI: fullContent
  })),
  createAssistantMessage: vi.fn((content, inputTokens, outputTokens) => ({
    id: 'assistant-1',
    type: 'assistant',
    content,
    inputTokens,
    outputTokens,
    timestamp: new Date()
  })),
  createErrorMessage: vi.fn((error, sidecarError) => ({
    id: 'error-1',
    type: 'assistant',
    content: sidecarError?.message || sidecarError?.shortMessage || (typeof error === 'string' ? error : 'Error'),
    isError: true,
    structuredError: sidecarError,
    timestamp: new Date()
  }))
}));

describe('createSendMessageCallback', () => {
  const mockSetMessages = vi.fn();
  const mockSetIsLoading = vi.fn();
  const mockSetAiError = vi.fn();
  const mockAbortControllerRef = { current: null as AbortController | null };
  const mockActiveRequestIdRef = { current: 0 };
  const mockCurrentRequestIdRef = { current: null as string | null };

  const defaultDeps: SendMessageDependencies = {
    apiKey: 'test-api-key',
    provider: 'gemini',
    selectedModel: 'gemini-2.0-flash',
    temperature: 0.7,
    maxTokens: 1000,
    messages: [] as ChatMessage[],
    setMessages: mockSetMessages,
    setIsLoading: mockSetIsLoading,
    setAiError: mockSetAiError,
    abortControllerRef: mockAbortControllerRef,
    activeRequestIdRef: mockActiveRequestIdRef,
    currentRequestIdRef: mockCurrentRequestIdRef,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveRequestIdRef.current = 0;
    mockAbortControllerRef.current = null;
    mockCurrentRequestIdRef.current = null;
  });

  describe('Success cases', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        response: 'AI response',
        usage_metadata: {
          input_tokens: 10,
          output_tokens: 20
        }
      };

      vi.mocked(aiApi.chat).mockResolvedValue(mockResponse);

      const sendMessage = createSendMessageCallback(defaultDeps);
      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: 'Hello',
        images: [],
        answerMode: 'concise'
      };

      await sendMessage(request);

      expect(mockSetMessages).toHaveBeenCalledTimes(2); // User message + AI response
      expect(mockSetIsLoading).toHaveBeenCalledWith(true);
      expect(mockSetIsLoading).toHaveBeenCalledWith(false);
      expect(mockSetAiError).toHaveBeenCalledWith(null);
    });

    it('should handle retry without creating duplicate user message', async () => {
      const mockResponse = {
        response: 'AI response',
        usage_metadata: undefined
      };

      vi.mocked(aiApi.chat).mockResolvedValue(mockResponse);

      const sendMessage = createSendMessageCallback(defaultDeps);
      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: 'Hello',
        images: [],
        answerMode: 'concise',
        isRetry: true
      };

      await sendMessage(request);

      // Should only add AI response, not user message
      expect(mockSetMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe('Structured error handling', () => {
    it('should handle sidecar_error from API response', async () => {
      const mockResponse = {
        response: 'Error message',
        usage_metadata: undefined,
        sidecar_error: {
          errorType: 'feature-not-supported' as const,
          shortMessage: 'DeepSeek doesn\'t support images',
          message: 'The deepseek-chat model doesn\'t support image analysis.',
          suggestion: 'Try vision-capable models like Gemini 2.0 Flash.'
        }
      };

      vi.mocked(aiApi.chat).mockResolvedValue(mockResponse);

      const sendMessage = createSendMessageCallback(defaultDeps);
      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: 'Analyze this image',
        images: [{ data: 'base64data', width: 100, height: 100 }],
        answerMode: 'concise'
      };

      await sendMessage(request);

      expect(mockSetMessages).toHaveBeenCalledTimes(2); // User message + Error message
      expect(mockSetAiError).toHaveBeenCalledWith('DeepSeek doesn\'t support images');
      
      // Check that createErrorMessage was called with structured error
      const { createErrorMessage } = await import('../messageFactory');
      expect(createErrorMessage).toHaveBeenCalledWith(
        'The deepseek-chat model doesn\'t support image analysis.',
        expect.objectContaining({
          errorType: 'feature-not-supported',
          shortMessage: 'DeepSeek doesn\'t support images',
          suggestion: 'Try vision-capable models like Gemini 2.0 Flash.'
        })
      );
    });

    it('should handle api-error type', async () => {
      const mockResponse = {
        response: 'Error',
        usage_metadata: undefined,
        sidecar_error: {
          errorType: 'api-error' as const,
          shortMessage: 'Invalid API key',
          message: 'The provided API key is invalid.',
          suggestion: 'Check your API key in Settings.'
        }
      };

      vi.mocked(aiApi.chat).mockResolvedValue(mockResponse);

      const sendMessage = createSendMessageCallback(defaultDeps);
      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: 'Hello',
        images: [],
        answerMode: 'concise'
      };

      await sendMessage(request);

      expect(mockSetAiError).toHaveBeenCalledWith('Invalid API key');
    });

    it('should handle error without suggestion', async () => {
      const mockResponse = {
        response: 'Error',
        usage_metadata: undefined,
        sidecar_error: {
          errorType: 'unknown-error' as const,
          shortMessage: 'Error occurred',
          message: 'An error occurred.',
          suggestion: undefined
        }
      };

      vi.mocked(aiApi.chat).mockResolvedValue(mockResponse);

      const sendMessage = createSendMessageCallback(defaultDeps);
      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: 'Hello',
        images: [],
        answerMode: 'concise'
      };

      await sendMessage(request);

      expect(mockSetMessages).toHaveBeenCalledTimes(2);
      expect(mockSetAiError).toHaveBeenCalledWith('Error occurred');
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      vi.mocked(aiApi.chat).mockRejectedValue(networkError);

      const sendMessage = createSendMessageCallback(defaultDeps);
      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: 'Hello',
        images: [],
        answerMode: 'concise'
      };

      await sendMessage(request);

      expect(mockSetMessages).toHaveBeenCalledTimes(2); // User message + Error message
      expect(mockSetIsLoading).toHaveBeenCalledWith(false);
    });

    it('should handle abort errors gracefully', async () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      vi.mocked(aiApi.chat).mockRejectedValue(abortError);

      const sendMessage = createSendMessageCallback(defaultDeps);
      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: 'Hello',
        images: [],
        answerMode: 'concise'
      };

      await sendMessage(request);

      // Abort errors should not add error messages
      expect(mockSetMessages).toHaveBeenCalledTimes(1); // Only user message
    });
  });

  describe('Validation', () => {
    it('should not send message without provider', async () => {
      const sendMessage = createSendMessageCallback({
        ...defaultDeps,
        provider: null
      });

      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: 'Hello',
        images: [],
        answerMode: 'concise'
      };

      await sendMessage(request);

      expect(aiApi.chat).not.toHaveBeenCalled();
      expect(mockSetMessages).not.toHaveBeenCalled();
    });

    it('should not send message without API key for non-Ollama providers', async () => {
      const sendMessage = createSendMessageCallback({
        ...defaultDeps,
        apiKey: null,
        provider: 'gemini'
      });

      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: 'Hello',
        images: [],
        answerMode: 'concise'
      };

      await sendMessage(request);

      expect(aiApi.chat).not.toHaveBeenCalled();
    });

    it('should allow sending message without API key for Ollama', async () => {
      const mockResponse = {
        response: 'AI response',
        usage_metadata: undefined
      };

      vi.mocked(aiApi.chat).mockResolvedValue(mockResponse);

      const sendMessage = createSendMessageCallback({
        ...defaultDeps,
        apiKey: null,
        provider: 'ollama'
      });

      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: 'Hello',
        images: [],
        answerMode: 'concise'
      };

      await sendMessage(request);

      expect(aiApi.chat).toHaveBeenCalled();
    });
  });

  describe('ArXiv papers', () => {
    it('should pass arxiv_papers to createAssistantMessage on success', async () => {
      const arxivPapers = [{
        id: '2401.00001', title: 'Test Paper', authors: ['Author'],
        summary: 'Summary', arxiv_url: 'https://arxiv.org/abs/2401.00001',
        pdf_url: 'https://arxiv.org/pdf/2401.00001', published: '2024-01-01',
      }];
      const mockResponse = {
        response: 'Found papers',
        usage_metadata: { input_tokens: 10, output_tokens: 20 },
        arxiv_papers: arxivPapers,
      };

      vi.mocked(aiApi.chat).mockResolvedValue(mockResponse);

      const sendMessage = createSendMessageCallback(defaultDeps);
      await sendMessage({
        messageTextDisplayedInChatBubble: 'Find papers',
        images: [],
        answerMode: 'concise',
      });

      const { createAssistantMessage } = await import('../messageFactory');
      expect(createAssistantMessage).toHaveBeenCalledWith('Found papers', 10, 20, arxivPapers, undefined);
    });

    it('should strip arxiv block from conversation history', async () => {
      const embeddedContent = 'AI answer\n<!-- arxiv-papers\n[{"id":"1","title":"T","authors":["A"],"summary":"S","arxiv_url":"u","pdf_url":"p","published":"2024"}]\n-->';
      const depsWithHistory: SendMessageDependencies = {
        ...defaultDeps,
        messages: [
          { id: '1', type: 'user', content: 'Search arxiv', timestamp: new Date() },
          { id: '2', type: 'assistant', content: embeddedContent, timestamp: new Date() },
        ],
      };

      vi.mocked(aiApi.chat).mockResolvedValue({ response: 'OK', usage_metadata: undefined });

      const sendMessage = createSendMessageCallback(depsWithHistory);
      await sendMessage({
        messageTextDisplayedInChatBubble: 'Follow up',
        images: [],
        answerMode: 'concise',
      });

      const chatCall = vi.mocked(aiApi.chat).mock.calls[0][0];
      const assistantEntry = chatCall.conversation_history.find(
        (h: { role: string }) => h.role === 'assistant'
      );
      expect(assistantEntry?.content).toBe('AI answer');
      expect(assistantEntry?.content).not.toContain('<!-- arxiv-papers');
    });
  });

  describe('File content handling', () => {
    it('should add EMPTY_FILE marker when file has no content', async () => {
      const mockFetchFileContent = vi.fn().mockResolvedValue({ content: '' });
      vi.mocked(aiApi.chat).mockResolvedValue({ response: 'ok', usage_metadata: undefined });

      const sendMessage = createSendMessageCallback({
        ...defaultDeps,
        fetchFileContent: mockFetchFileContent,
      });

      await sendMessage({
        messageTextDisplayedInChatBubble: 'Explain this',
        images: [],
        answerMode: 'concise',
        files: [{ id: 'file-1', name: 'thesis.pdf' }],
      });

      const chatCall = vi.mocked(aiApi.chat).mock.calls[0][0];
      expect(chatCall.message).toContain('[EMPTY_FILE: thesis.pdf]');
    });

    it('should add EMPTY_FILE marker when file fetch fails', async () => {
      const mockFetchFileContent = vi.fn().mockRejectedValue(new Error('fetch error'));
      vi.mocked(aiApi.chat).mockResolvedValue({ response: 'ok', usage_metadata: undefined });

      const sendMessage = createSendMessageCallback({
        ...defaultDeps,
        fetchFileContent: mockFetchFileContent,
      });

      await sendMessage({
        messageTextDisplayedInChatBubble: 'Explain this',
        images: [],
        answerMode: 'concise',
        files: [{ id: 'file-1', name: 'broken.pdf' }],
      });

      const chatCall = vi.mocked(aiApi.chat).mock.calls[0][0];
      expect(chatCall.message).toContain('[EMPTY_FILE: broken.pdf]');
    });

    it('should send attached_file_names in API request when files are attached', async () => {
      const mockFetchFileContent = vi.fn().mockResolvedValue({ content: 'PDF text content' });
      vi.mocked(aiApi.chat).mockResolvedValue({ response: 'ok', usage_metadata: undefined });

      const sendMessage = createSendMessageCallback({
        ...defaultDeps,
        fetchFileContent: mockFetchFileContent,
      });

      await sendMessage({
        messageTextDisplayedInChatBubble: 'Explain this',
        images: [],
        answerMode: 'concise',
        files: [
          { id: 'file-1', name: 'thesis.pdf' },
          { id: 'file-2', name: 'notes.md' },
        ],
      });

      const chatCall = vi.mocked(aiApi.chat).mock.calls[0][0];
      expect(chatCall.attached_file_names).toEqual(['thesis.pdf', 'notes.md']);
    });

    it('should send empty attached_file_names when no files are attached', async () => {
      vi.mocked(aiApi.chat).mockResolvedValue({ response: 'ok', usage_metadata: undefined });

      const sendMessage = createSendMessageCallback(defaultDeps);
      await sendMessage({
        messageTextDisplayedInChatBubble: 'Hello',
        images: [],
        answerMode: 'concise',
      });

      const chatCall = vi.mocked(aiApi.chat).mock.calls[0][0];
      expect(chatCall.attached_file_names).toEqual([]);
    });

    it('should include file content normally when available', async () => {
      const mockFetchFileContent = vi.fn().mockResolvedValue({ content: 'PDF text content' });
      vi.mocked(aiApi.chat).mockResolvedValue({ response: 'ok', usage_metadata: undefined });

      const sendMessage = createSendMessageCallback({
        ...defaultDeps,
        fetchFileContent: mockFetchFileContent,
      });

      await sendMessage({
        messageTextDisplayedInChatBubble: 'Explain this',
        images: [],
        answerMode: 'concise',
        files: [{ id: 'file-1', name: 'paper.pdf' }],
      });

      const chatCall = vi.mocked(aiApi.chat).mock.calls[0][0];
      expect(chatCall.message).toContain('--- paper.pdf ---');
      expect(chatCall.message).toContain('PDF text content');
    });
  });

  describe('Context files handling', () => {
    it('should include contextFiles content in message sent to AI', async () => {
      const mockFetchFileContent = vi.fn().mockResolvedValue({ content: 'File content here' });
      vi.mocked(aiApi.chat).mockResolvedValue({ response: 'ok', usage_metadata: undefined });

      const sendMessage = createSendMessageCallback({
        ...defaultDeps,
        fetchFileContent: mockFetchFileContent,
        contextFiles: [{ id: 'ctx-1', name: 'context.pdf', path: '/context.pdf' }],
      });

      await sendMessage({
        messageTextDisplayedInChatBubble: 'Follow up question',
        images: [],
        answerMode: 'concise',
      });

      expect(mockFetchFileContent).toHaveBeenCalledWith('ctx-1', true);
      const chatCall = vi.mocked(aiApi.chat).mock.calls[0][0];
      expect(chatCall.message).toContain('--- context.pdf ---');
      expect(chatCall.message).toContain('File content here');
      expect(chatCall.message).toContain('Follow up question');
    });

    it('should deduplicate contextFiles and current files', async () => {
      const mockFetchFileContent = vi.fn().mockResolvedValue({ content: 'Content' });
      vi.mocked(aiApi.chat).mockResolvedValue({ response: 'ok', usage_metadata: undefined });

      const sendMessage = createSendMessageCallback({
        ...defaultDeps,
        fetchFileContent: mockFetchFileContent,
        contextFiles: [
          { id: 'file-1', name: 'shared.pdf', path: '/shared.pdf' },
          { id: 'file-2', name: 'old.pdf', path: '/old.pdf' },
        ],
      });

      await sendMessage({
        messageTextDisplayedInChatBubble: 'Question',
        images: [],
        answerMode: 'concise',
        files: [{ id: 'file-1', name: 'shared.pdf', path: '/shared.pdf' }],
      });

      // file-1 appears in both contextFiles and current files — should only be fetched once
      const fetchCalls = mockFetchFileContent.mock.calls.map(c => c[0]);
      expect(fetchCalls.filter(id => id === 'file-1')).toHaveLength(1);
      expect(fetchCalls).toContain('file-2');
    });

    it('should use messageTextWithFileContentsSentToAI in conversation history for user messages', async () => {
      const depsWithHistory: SendMessageDependencies = {
        ...defaultDeps,
        messages: [
          {
            id: '1', type: 'user', content: 'Explain this file',
            messageTextWithFileContentsSentToAI: '--- doc.pdf ---\nFile content\n\nExplain this file',
            timestamp: new Date(),
          },
          { id: '2', type: 'assistant', content: 'Here is the explanation', timestamp: new Date() },
        ],
      };

      vi.mocked(aiApi.chat).mockResolvedValue({ response: 'OK', usage_metadata: undefined });

      const sendMessage = createSendMessageCallback(depsWithHistory);
      await sendMessage({
        messageTextDisplayedInChatBubble: 'Follow up',
        images: [],
        answerMode: 'concise',
      });

      const chatCall = vi.mocked(aiApi.chat).mock.calls[0][0];
      const userEntry = chatCall.conversation_history.find(
        (h: { role: string }) => h.role === 'user'
      );
      // Should use full content with file data so AI retains file context
      expect(userEntry?.content).toContain('--- doc.pdf ---');
      expect(userEntry?.content).toContain('File content');
    });

    it('should fall back to content when messageTextWithFileContentsSentToAI is undefined', async () => {
      const depsWithHistory: SendMessageDependencies = {
        ...defaultDeps,
        messages: [
          { id: '1', type: 'user', content: 'Hello', timestamp: new Date() },
          { id: '2', type: 'assistant', content: 'Hi there', timestamp: new Date() },
        ],
      };

      vi.mocked(aiApi.chat).mockResolvedValue({ response: 'OK', usage_metadata: undefined });

      const sendMessage = createSendMessageCallback(depsWithHistory);
      await sendMessage({
        messageTextDisplayedInChatBubble: 'Follow up',
        images: [],
        answerMode: 'concise',
      });

      const chatCall = vi.mocked(aiApi.chat).mock.calls[0][0];
      const userEntry = chatCall.conversation_history.find(
        (h: { role: string }) => h.role === 'user'
      );
      expect(userEntry?.content).toBe('Hello');
    });

    it('should always use content for assistant messages in history', async () => {
      const depsWithHistory: SendMessageDependencies = {
        ...defaultDeps,
        messages: [
          { id: '1', type: 'assistant', content: 'Assistant response', timestamp: new Date() },
        ],
      };

      vi.mocked(aiApi.chat).mockResolvedValue({ response: 'OK', usage_metadata: undefined });

      const sendMessage = createSendMessageCallback(depsWithHistory);
      await sendMessage({
        messageTextDisplayedInChatBubble: 'Follow up',
        images: [],
        answerMode: 'concise',
      });

      const chatCall = vi.mocked(aiApi.chat).mock.calls[0][0];
      const assistantEntry = chatCall.conversation_history.find(
        (h: { role: string }) => h.role === 'assistant'
      );
      expect(assistantEntry?.content).toBe('Assistant response');
    });
  });

  describe('Image handling', () => {
    it('should send message with images', async () => {
      const mockResponse = {
        response: 'AI response',
        usage_metadata: undefined
      };

      vi.mocked(aiApi.chat).mockResolvedValue(mockResponse);

      const sendMessage = createSendMessageCallback(defaultDeps);
      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: 'Analyze this',
        images: [
          { data: 'base64data1', width: 100, height: 100 },
          { data: 'base64data2', width: 200, height: 200 }
        ],
        answerMode: 'concise'
      };

      await sendMessage(request);

      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          images: expect.arrayContaining([
            expect.objectContaining({ data: expect.any(String) })
          ])
        }),
        'test-api-key',
        expect.any(String)
      );
    });

    it('should add fallback text for image-only requests', async () => {
      const mockResponse = {
        response: 'AI response',
        usage_metadata: undefined
      };

      vi.mocked(aiApi.chat).mockResolvedValue(mockResponse);

      const sendMessage = createSendMessageCallback(defaultDeps);
      const request: SendMessageRequest = {
        messageTextDisplayedInChatBubble: '',
        images: [{ data: 'base64data', width: 100, height: 100 }],
        answerMode: 'concise'
      };

      await sendMessage(request);

      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Analyze this snippet'
        }),
        'test-api-key',
        expect.any(String)
      );
    });
  });
});

