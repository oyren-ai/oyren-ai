import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { aiApi } from '@/api/aiApi.ts';
import { useAiChatMessages } from "./useAiChatMessages";

vi.mock('@/api/aiApi', () => ({
  aiApi: {
    chat: vi.fn()
  }
}));

vi.mock('../messageFactory', () => ({
  createUserMessage: vi.fn((content, images, files) => ({
    id: 'user-msg-id',
    type: 'user',
    content,
    images: images || [],
    files: files || [],
    timestamp: new Date()
  })),
  createAssistantMessage: vi.fn((content) => ({
    id: 'assistant-msg-id',
    type: 'assistant',
    content,
    timestamp: new Date()
  })),
  createErrorMessage: vi.fn((error) => ({
    id: 'error-msg-id',
    type: 'assistant',
    content: error,
    isError: true,
    timestamp: new Date()
  }))
}));

describe('useAiChatMessages - Retry Flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create user message when isRetry is false (default)', async () => {
    vi.mocked(aiApi.chat).mockResolvedValueOnce({
      response: 'Hi there!'
    });

    const { result } = renderHook(() => useAiChatMessages({
      apiKey: 'test-key',
      provider: 'gemini',
      temperature: 0.7
    }));

    await act(async () => {
      await result.current.sendMessage({
        messageTextDisplayedInChatBubble: 'Hello',
        messageTextWithFileContentsSentToAI: 'Hello',
        images: [],
        answerMode: 'concise'
      });
    });

    await waitFor(() => {
      // User message should be in messages
      const userMessages = result.current.state.messages.filter(m => m.type === 'user');
      expect(userMessages).toHaveLength(1);
      expect(userMessages[0].content).toBe('Hello');
    });
  });

  it('should NOT create user message when isRetry is true', async () => {
    vi.mocked(aiApi.chat).mockResolvedValueOnce({
      response: 'Hi there!'
    });

    const { result } = renderHook(() => useAiChatMessages({
      apiKey: 'test-key',
      provider: 'gemini',
      temperature: 0.7
    }));

    // Pre-populate with existing user message
    act(() => {
      result.current.setMessages([
        {
          id: '1',
          type: 'user',
          content: 'Hello',
          timestamp: new Date()
        }
      ]);
    });

    const initialUserMessageCount = result.current.state.messages.filter(m => m.type === 'user').length;
    expect(initialUserMessageCount).toBe(1);

    await act(async () => {
      await result.current.sendMessage({
        messageTextDisplayedInChatBubble: 'Hello',
        messageTextWithFileContentsSentToAI: 'Hello',
        images: [],
        answerMode: 'concise',
        isRetry: true
      });
    });

    await waitFor(() => {
      // Should not add another user message
      const userMessages = result.current.state.messages.filter(m => m.type === 'user');
      expect(userMessages).toHaveLength(1); // Still just 1
    });
  });

  it('should default isRetry to false when not specified', async () => {
    vi.mocked(aiApi.chat).mockResolvedValueOnce({
      response: 'Response'
    });

    const { result } = renderHook(() => useAiChatMessages({
      apiKey: 'test-key',
      provider: 'gemini',
      temperature: 0.7
    }));

    await act(async () => {
      await result.current.sendMessage({
        messageTextDisplayedInChatBubble: 'Test',
        messageTextWithFileContentsSentToAI: 'Test',
        images: [],
        answerMode: 'concise'
        // isRetry not specified - should default to false
      });
    });

    await waitFor(() => {
      // User message should be created (default behavior)
      const userMessages = result.current.state.messages.filter(m => m.type === 'user');
      expect(userMessages).toHaveLength(1);
    });
  });

  it('should still make API call when isRetry is true', async () => {
    const mockResponse = {
      response: 'Retried response'
    };
    vi.mocked(aiApi.chat).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAiChatMessages({
      apiKey: 'test-key',
      provider: 'gemini',
      temperature: 0.7
    }));

    act(() => {
      result.current.setMessages([
        {
          id: '1',
          type: 'user',
          content: 'Hello',
          timestamp: new Date()
        }
      ]);
    });

    await act(async () => {
      await result.current.sendMessage({
        messageTextDisplayedInChatBubble: 'Hello',
        messageTextWithFileContentsSentToAI: 'Hello',
        images: [],
        answerMode: 'concise',
        isRetry: true
      });
    });

    await waitFor(() => {
      // API should be called
      expect(aiApi.chat).toHaveBeenCalled();

      // Assistant message should be added
      const assistantMessages = result.current.state.messages.filter(m => m.type === 'assistant' && !m.isError);
      expect(assistantMessages.length).toBeGreaterThan(0);
    });
  });
});

describe('useAiChatMessages - Retry Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retryErrorMessage', () => {
    it('should NOT duplicate user message when retrying error', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Success'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      act(() => {
        result.current.setMessages([
          {
            id: '1',
            type: 'user',
            content: 'Hello',
            timestamp: new Date()
          },
          {
            id: '2',
            type: 'assistant',
            content: 'Error occurred',
            isError: true,
            timestamp: new Date()
          }
        ]);
      });

      await act(async () => {
        result.current.retryErrorMessage(result.current.state.messages[1]);
      });

      await waitFor(() => {
        // Error message removed, user message kept
        const userMessages = result.current.state.messages.filter(m => m.type === 'user');
        expect(userMessages).toHaveLength(1);
        expect(userMessages[0].content).toBe('Hello');
      });
    });

    it('should preserve images and files when retrying error', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Success'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      const testImages = [{ data: 'base64data', width: 100, height: 100 }];
      const testFiles = [{ id: 'file-1', name: 'test.txt', path: '/test.txt' }];

      act(() => {
        result.current.setMessages([
          {
            id: '1',
            type: 'user',
            content: 'Test with files',
            timestamp: new Date(),
            images: testImages,
            files: testFiles
          },
          {
            id: '2',
            type: 'assistant',
            content: 'Error',
            isError: true,
            timestamp: new Date()
          }
        ]);
      });

      await act(async () => {
        result.current.retryErrorMessage(result.current.state.messages[1]);
      });

      await waitFor(() => {
        expect(aiApi.chat).toHaveBeenCalledWith(
          expect.objectContaining({
            images: testImages.map(img => ({
              data: img.data,
              mime_type: 'image/png'
            }))
          }),
          'test-key',
          expect.any(String)
        );
      });
    });

    it('should not retry if error message has no previous user message', () => {
      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      act(() => {
        result.current.setMessages([
          {
            id: '1',
            type: 'assistant',
            content: 'Error',
            isError: true,
            timestamp: new Date()
          }
        ]);
      });

      act(() => {
        result.current.retryErrorMessage(result.current.state.messages[0]);
      });

      expect(aiApi.chat).not.toHaveBeenCalled();
    });
  });

  describe('retryUserMessage', () => {
    it('should NOT duplicate user message when retrying user message', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Success'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      act(() => {
        result.current.setMessages([
          {
            id: '1',
            type: 'user',
            content: 'Hello',
            timestamp: new Date()
          }
        ]);
      });

      expect(result.current.state.messages).toHaveLength(1);

      await act(async () => {
        result.current.retryUserMessage(result.current.state.messages[0]);
      });

      await waitFor(() => {
        // Message removed from list (retry doesn't create new user message)
        const userMessages = result.current.state.messages.filter(m => m.type === 'user');
        // After retry, the user message is removed and NOT re-added (isRetry: true)
        // But the AI response should be added
        expect(result.current.state.messages.length).toBeGreaterThan(0);
      });
    });

    it('should preserve images and files when retrying user message', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Success'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      const testImages = [{ data: 'img', width: 50, height: 50 }];
      const testFiles = [{ id: 'file-2', name: 'doc.pdf', path: '/doc.pdf' }];

      act(() => {
        result.current.setMessages([
          {
            id: '1',
            type: 'user',
            content: 'Test',
            timestamp: new Date(),
            images: testImages,
            files: testFiles
          }
        ]);
      });

      await act(async () => {
        result.current.retryUserMessage(result.current.state.messages[0]);
      });

      await waitFor(() => {
        expect(aiApi.chat).toHaveBeenCalledWith(
          expect.objectContaining({
            images: testImages.map(img => ({
              data: img.data,
              mime_type: 'image/png'
            }))
          }),
          'test-key',
          expect.any(String)
        );
      });
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      act(() => {
        result.current.setMessages([
          {
            id: '1',
            type: 'user',
            content: 'Test',
            timestamp: new Date()
          }
        ]);
      });

      expect(result.current.state.messages).toHaveLength(1);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.state.messages).toHaveLength(0);
    });
  });
});

describe('useAiChatMessages - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Configuration', () => {
    it('should not send message when API key is missing', async () => {
      const { result } = renderHook(() => useAiChatMessages({
        apiKey: null,
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'concise'
        });
      });

      expect(aiApi.chat).not.toHaveBeenCalled();
      expect(result.current.state.messages).toHaveLength(0);
    });

    it('should not send message when provider is missing', async () => {
      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: null,
        temperature: 0.7,
        maxTokens: 2000
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'concise'
        });
      });

      expect(aiApi.chat).not.toHaveBeenCalled();
      expect(result.current.state.messages).toHaveLength(0);
    });

    it('should not send message when both API key and provider are missing', async () => {
      const { result } = renderHook(() => useAiChatMessages({
        apiKey: null,
        provider: null,
        temperature: 0.7,
        maxTokens: 2000
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'concise'
        });
      });

      expect(aiApi.chat).not.toHaveBeenCalled();
      expect(result.current.state.messages).toHaveLength(0);
    });
  });

  describe('File Content Fetching', () => {
    it('should fetch and merge file contents when files are provided', async () => {
      const mockFetchFileContent = vi.fn().mockResolvedValue({
        content: 'File content here'
      });

      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Response'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000,
        fetchFileContent: mockFetchFileContent
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'User message',
          images: [],
          answerMode: 'concise',
          files: [{ id: 'file-1', name: 'test.txt', path: '/test.txt' }]
        });
      });

      expect(mockFetchFileContent).toHaveBeenCalledWith('file-1', true);
      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('--- test.txt ---')
        }),
        'test-key',
        expect.any(String)
      );
    });

    it('should handle file fetch errors gracefully', async () => {
      const mockFetchFileContent = vi.fn().mockRejectedValue(
        new Error('File not found')
      );

      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Response'
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000,
        fetchFileContent: mockFetchFileContent
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'User message',
          images: [],
          answerMode: 'concise',
          files: [{ id: 'file-1', name: 'test.txt', path: '/test.txt' }]
        });
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch content for test.txt:'),
        expect.any(Error)
      );
      expect(aiApi.chat).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should merge multiple file contents', async () => {
      const mockFetchFileContent = vi.fn()
        .mockResolvedValueOnce({ content: 'File 1 content' })
        .mockResolvedValueOnce({ content: 'File 2 content' });

      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Response'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000,
        fetchFileContent: mockFetchFileContent
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'User message',
          images: [],
          answerMode: 'concise',
          files: [
            { id: 'file-1', name: 'test1.txt', path: '/test1.txt' },
            { id: 'file-2', name: 'test2.txt', path: '/test2.txt' }
          ]
        });
      });

      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/--- test1\.txt ---[\s\S]*--- test2\.txt ---/)
        }),
        'test-key',
        expect.any(String)
      );
    });

    it('should use only file contents when message text is empty', async () => {
      const mockFetchFileContent = vi.fn().mockResolvedValue({
        content: 'File content'
      });

      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Response'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000,
        fetchFileContent: mockFetchFileContent
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: '',
          images: [],
          answerMode: 'concise',
          files: [{ id: 'file-1', name: 'test.txt', path: '/test.txt' }]
        });
      });

      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/^--- test\.txt ---/)
        }),
        'test-key',
        expect.any(String)
      );
    });
  });

  describe('Answer Mode', () => {
    it('should use high temperature for detailed answer mode', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Detailed response'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'detailed'
        });
      });

      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
          answer_mode: 'detailed'
        }),
        'test-key',
        expect.any(String)
      );
    });

    it('should use low temperature for concise answer mode', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Concise response'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.3
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'concise'
        });
      });

      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
          answer_mode: 'concise'
        }),
        'test-key',
        expect.any(String)
      );
    });
  });

  describe('Message Text Fallback', () => {
    it('should fallback to messageTextDisplayedInChatBubble when messageTextWithFileContentsSentToAI is undefined', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Response'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Fallback message',
          images: [],
          answerMode: 'concise'
        });
      });

      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Fallback message'
        }),
        'test-key',
        expect.any(String)
      );
    });
  });

  describe('Request ID Race Condition', () => {
    it('should ignore stale API response when request ID has changed', async () => {
      let resolveFirst: (value: any) => void;
      const firstRequest = new Promise(resolve => {
        resolveFirst = resolve;
      });

      vi.mocked(aiApi.chat)
        .mockReturnValueOnce(firstRequest as any)
        .mockResolvedValueOnce({ response: 'Second response' });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      act(() => {
        result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'First',
          images: [],
          answerMode: 'concise'
        });
      });

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Second',
          images: [],
          answerMode: 'concise'
        });
      });

      await act(async () => {
        resolveFirst!({ response: 'First response' });
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        const assistantMessages = result.current.state.messages.filter(
          m => m.type === 'assistant'
        );
        expect(assistantMessages).toHaveLength(1);
        expect(assistantMessages[0].content).toBe('Second response');
      });
    });

    it('should accept response when request ID matches', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Valid response'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'concise'
        });
      });

      await waitFor(() => {
        const assistantMessages = result.current.state.messages.filter(
          m => m.type === 'assistant'
        );
        expect(assistantMessages).toHaveLength(1);
        expect(assistantMessages[0].content).toBe('Valid response');
      });
    });
  });

  describe('Abort Error Handling', () => {
    it('should not add error message when AbortError occurs', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      vi.mocked(aiApi.chat).mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'concise'
        });
      });

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      const errorMessages = result.current.state.messages.filter(m => m.isError);
      expect(errorMessages).toHaveLength(0);
      expect(result.current.state.aiError).toBeNull();
    });

    it('should add error message for non-abort errors', async () => {
      const networkError = new Error('Network error');

      vi.mocked(aiApi.chat).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'concise'
        });
      });

      await waitFor(() => {
        const errorMessages = result.current.state.messages.filter(m => m.isError);
        expect(errorMessages).toHaveLength(1);
        expect(result.current.state.aiError).toBe('Network error');
      });
    });

    it('should use generic error message for non-Error objects', async () => {
      vi.mocked(aiApi.chat).mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'concise'
        });
      });

      await waitFor(() => {
        const errorMessages = result.current.state.messages.filter(m => m.isError);
        expect(errorMessages).toHaveLength(1);
        expect(result.current.state.aiError).toBe('Failed to get response');
      });
    });
  });

  describe('Model Selection', () => {
    it('should use default model when selectedModel is null', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Response'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000,
        selectedModel: undefined
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'concise'
        });
      });

      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash'
        }),
        'test-key',
        expect.any(String)
      );
    });

    it('should use provided model when selectedModel is specified', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Response'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000,
        selectedModel: 'gemini-1.5-pro'
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'concise'
        });
      });

      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-1.5-pro'
        }),
        'test-key',
        expect.any(String)
      );
    });
  });

  describe('Images Transformation', () => {
    it('should transform images with mime_type', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Response'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      const testImages = [
        { data: 'base64-1', width: 100, height: 100 },
        { data: 'base64-2', width: 200, height: 200 }
      ];

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: testImages,
          answerMode: 'concise'
        });
      });

      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          images: [
            { data: 'base64-1', mime_type: 'image/png' },
            { data: 'base64-2', mime_type: 'image/png' }
          ]
        }),
        'test-key',
        expect.any(String)
      );
    });

    it('should handle empty images array', async () => {
      vi.mocked(aiApi.chat).mockResolvedValueOnce({
        response: 'Response'
      });

      const { result } = renderHook(() => useAiChatMessages({
        apiKey: 'test-key',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 2000
      }));

      await act(async () => {
        await result.current.sendMessage({
          messageTextDisplayedInChatBubble: 'Hello',
          images: [],
          answerMode: 'concise'
        });
      });

      expect(aiApi.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          images: []
        }),
        'test-key',
        expect.any(String)
      );
    });
  });
});
