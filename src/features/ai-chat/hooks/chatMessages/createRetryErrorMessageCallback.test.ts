import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRetryErrorMessageCallback } from './createRetryErrorMessageCallback';
import type { ChatMessage } from '../../types';
import type { SendMessageRequest } from './createSendMessageCallback';

describe('createRetryErrorMessageCallback', () => {
  const mockSetMessages = vi.fn();
  const mockSendMessage = vi.fn();

  const defaultDeps = {
    messages: [] as ChatMessage[],
    setMessages: mockSetMessages,
    sendMessage: mockSendMessage,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retry user message before error', () => {
    const userMessage: ChatMessage = {
      id: '1',
      type: 'user',
      content: 'Hello',
      timestamp: new Date(),
    };

    const errorMessage: ChatMessage = {
      id: '2',
      type: 'assistant',
      content: 'Error occurred',
      timestamp: new Date(),
      isError: true,
    };

    const messages = [userMessage, errorMessage];
    const callback = createRetryErrorMessageCallback({
      ...defaultDeps,
      messages,
    });

    callback(errorMessage);

    expect(mockSetMessages).toHaveBeenCalledWith([userMessage]);
    expect(mockSendMessage).toHaveBeenCalledWith({
      messageTextDisplayedInChatBubble: 'Hello',
      messageTextWithFileContentsSentToAI: 'Hello',
      images: [],
      answerMode: 'concise',
      files: undefined,
      isRetry: true,
    });
  });

  it('should handle user message with images', () => {
    const userMessage: ChatMessage = {
      id: '1',
      type: 'user',
      content: 'Analyze this',
      timestamp: new Date(),
      images: [{ data: 'base64data', width: 100, height: 100 }],
    };

    const errorMessage: ChatMessage = {
      id: '2',
      type: 'assistant',
      content: 'Error',
      timestamp: new Date(),
      isError: true,
    };

    const messages = [userMessage, errorMessage];
    const callback = createRetryErrorMessageCallback({
      ...defaultDeps,
      messages,
    });

    callback(errorMessage);

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [{ data: 'base64data', width: 100, height: 100 }],
      })
    );
  });

  it('should not retry if error is first message', () => {
    const errorMessage: ChatMessage = {
      id: '1',
      type: 'assistant',
      content: 'Error',
      timestamp: new Date(),
      isError: true,
    };

    const messages = [errorMessage];
    const callback = createRetryErrorMessageCallback({
      ...defaultDeps,
      messages,
    });

    callback(errorMessage);

    expect(mockSetMessages).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('should not retry if previous message is not user', () => {
    const assistantMessage: ChatMessage = {
      id: '1',
      type: 'assistant',
      content: 'Response',
      timestamp: new Date(),
    };

    const errorMessage: ChatMessage = {
      id: '2',
      type: 'assistant',
      content: 'Error',
      timestamp: new Date(),
      isError: true,
    };

    const messages = [assistantMessage, errorMessage];
    const callback = createRetryErrorMessageCallback({
      ...defaultDeps,
      messages,
    });

    callback(errorMessage);

    expect(mockSetMessages).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('should use messageTextWithFileContentsSentToAI if available', () => {
    const userMessage: ChatMessage = {
      id: '1',
      type: 'user',
      content: 'Hello',
      messageTextWithFileContentsSentToAI: 'Hello with file content',
      timestamp: new Date(),
    };

    const errorMessage: ChatMessage = {
      id: '2',
      type: 'assistant',
      content: 'Error',
      timestamp: new Date(),
      isError: true,
    };

    const messages = [userMessage, errorMessage];
    const callback = createRetryErrorMessageCallback({
      ...defaultDeps,
      messages,
    });

    callback(errorMessage);

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageTextWithFileContentsSentToAI: 'Hello with file content',
      })
    );
  });

  it('should handle empty messages array', () => {
    const errorMessage: ChatMessage = {
      id: '1',
      type: 'assistant',
      content: 'Error',
      timestamp: new Date(),
      isError: true,
    };

    const callback = createRetryErrorMessageCallback({
      ...defaultDeps,
      messages: [],
    });

    callback(errorMessage);

    expect(mockSetMessages).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});

