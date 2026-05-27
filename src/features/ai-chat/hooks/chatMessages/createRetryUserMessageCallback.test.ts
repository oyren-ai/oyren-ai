import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRetryUserMessageCallback } from './createRetryUserMessageCallback';
import type { ChatMessage } from '../../types';

describe('createRetryUserMessageCallback', () => {
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

  it('should remove user message and all following messages', () => {
    const userMessage: ChatMessage = {
      id: '1',
      type: 'user',
      content: 'Hello',
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: '2',
      type: 'assistant',
      content: 'Response',
      timestamp: new Date(),
    };

    const messages = [userMessage, assistantMessage];
    const callback = createRetryUserMessageCallback({
      ...defaultDeps,
      messages,
    });

    callback(userMessage);

    expect(mockSetMessages).toHaveBeenCalledWith([]);
    expect(mockSendMessage).toHaveBeenCalledWith({
      messageTextDisplayedInChatBubble: 'Hello',
      messageTextWithFileContentsSentToAI: 'Hello',
      images: [],
      answerMode: 'concise',
      files: undefined,
      isRetry: true,
    });
  });

  it('should handle user message with images and files', () => {
    const userMessage: ChatMessage = {
      id: '1',
      type: 'user',
      content: 'Analyze this',
      timestamp: new Date(),
      images: [{ data: 'base64data', width: 100, height: 100 }],
      files: [{ id: 'file1', name: 'doc.pdf', path: '/path/to/doc.pdf' }],
    };

    const messages = [userMessage];
    const callback = createRetryUserMessageCallback({
      ...defaultDeps,
      messages,
    });

    callback(userMessage);

    expect(mockSendMessage).toHaveBeenCalledWith({
      messageTextDisplayedInChatBubble: 'Analyze this',
      messageTextWithFileContentsSentToAI: 'Analyze this',
      images: [{ data: 'base64data', width: 100, height: 100 }],
      answerMode: 'concise',
      files: [{ id: 'file1', name: 'doc.pdf', path: '/path/to/doc.pdf' }],
      isRetry: true,
    });
  });

  it('should not retry if message not found', () => {
    const userMessage: ChatMessage = {
      id: '1',
      type: 'user',
      content: 'Hello',
      timestamp: new Date(),
    };

    const messages = [userMessage];
    const callback = createRetryUserMessageCallback({
      ...defaultDeps,
      messages,
    });

    const nonExistentMessage: ChatMessage = {
      id: '999',
      type: 'user',
      content: 'Not found',
      timestamp: new Date(),
    };

    callback(nonExistentMessage);

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

    const messages = [userMessage];
    const callback = createRetryUserMessageCallback({
      ...defaultDeps,
      messages,
    });

    callback(userMessage);

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageTextWithFileContentsSentToAI: 'Hello with file content',
      })
    );
  });
});

