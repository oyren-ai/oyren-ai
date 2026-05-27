import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRemoveMessageCallback } from './createRemoveMessageCallback';
import type { ChatMessage } from '../../types';

describe('createRemoveMessageCallback', () => {
  const mockSetMessages = vi.fn();

  const defaultDeps = {
    setMessages: mockSetMessages,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove message by id', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Message 1',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'assistant',
        content: 'Message 2',
        timestamp: new Date(),
      },
      {
        id: '3',
        type: 'user',
        content: 'Message 3',
        timestamp: new Date(),
      },
    ];

    mockSetMessages.mockImplementation((updater) => {
      if (typeof updater === 'function') {
        const newMessages = updater(messages);
        expect(newMessages).toEqual([
          messages[0],
          messages[2],
        ]);
      }
    });

    const callback = createRemoveMessageCallback(defaultDeps);
    callback('2');

    expect(mockSetMessages).toHaveBeenCalled();
  });

  it('should not remove anything if message id not found', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Message 1',
        timestamp: new Date(),
      },
    ];

    mockSetMessages.mockImplementation((updater) => {
      if (typeof updater === 'function') {
        const newMessages = updater(messages);
        expect(newMessages).toEqual(messages);
      }
    });

    const callback = createRemoveMessageCallback(defaultDeps);
    callback('999');

    expect(mockSetMessages).toHaveBeenCalled();
  });

  it('should handle empty messages array', () => {
    mockSetMessages.mockImplementation((updater) => {
      if (typeof updater === 'function') {
        const newMessages = updater([]);
        expect(newMessages).toEqual([]);
      }
    });

    const callback = createRemoveMessageCallback(defaultDeps);
    callback('1');

    expect(mockSetMessages).toHaveBeenCalled();
  });
});

