import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatMessages from '../ChatMessages';
import type { ChatMessage } from '../../types';
import { MockAiChatProvider } from '../../__tests__/testUtils';

// Mock the MessageItem component
vi.mock('./MessageItem', () => ({
  default: vi.fn(({ message, onRetryError }) => (
    <div data-testid={`message-${message.id}`}>
      {message.content}
      {message.isError && (
        <button onClick={onRetryError} data-testid="retry-button">
          Retry
        </button>
      )}
    </div>
  ))
}));

describe('ChatMessages', () => {
  const mockOnToggleReasoning = vi.fn();
  const mockOnRetryUserMessage = vi.fn();
  const mockOnRetryErrorMessage = vi.fn();
  const mockOnImagePreview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading conversation state when switching conversations', () => {
    render(
      <MockAiChatProvider value={{
        chatState: { isLoadingConversation: true },
      }}>
        <ChatMessages />
      </MockAiChatProvider>
    );
    expect(screen.getByText('Loading Conversation')).toBeInTheDocument();
    expect(screen.getByText('Retrieving your chat history and messages...')).toBeInTheDocument();
  });

  it('should show loading history state', () => {
    render(
      <MockAiChatProvider value={{
        chatState: { isLoadingHistory: true },
      }}>
        <ChatMessages />
      </MockAiChatProvider>
    );
    expect(screen.getByText('Loading chat history...')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    render(
      <MockAiChatProvider value={{
        chatState: { messages: [], workspaceId: 'ws-1' },
      }}>
        <ChatMessages />
      </MockAiChatProvider>
    );
    expect(screen.getByTestId('ai-chat-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/No conversation yet/)).toBeInTheDocument();
  });

  it('should render messages list', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'assistant',
        content: 'Hi there!',
        timestamp: new Date(),
      },
    ];

    render(
      <MockAiChatProvider value={{
        chatState: { messages },
      }}>
        <ChatMessages />
      </MockAiChatProvider>
    );
    expect(screen.getByTestId('messages-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-1')).toBeInTheDocument();
    expect(screen.getByTestId('message-2')).toBeInTheDocument();
  });

  it('should show loading indicator when loading', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      },
    ];

    render(
      <MockAiChatProvider value={{
        chatState: { messages, isLoading: true },
      }}>
        <ChatMessages />
      </MockAiChatProvider>
    );
    expect(screen.getByTestId('loading-message')).toBeInTheDocument();
  });

  it('should handle retry error message', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'assistant',
        content: 'Error',
        timestamp: new Date(),
        isError: true,
      },
    ];

    render(
      <MockAiChatProvider value={{
        chatState: { messages },
        actions: { onRetryErrorMessage: mockOnRetryErrorMessage },
      }}>
        <ChatMessages />
      </MockAiChatProvider>
    );
    fireEvent.click(screen.getByTestId('retry-button'));
    expect(mockOnRetryErrorMessage).toHaveBeenCalledWith(messages[0]);
  });

  it('should pass expanded reasoning state to messages', () => {
    const expandedReasoning = new Set(['2']);
    const messages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Question',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'assistant',
        content: 'Answer',
        timestamp: new Date(),
        reasoning: 'This is reasoning',
      },
    ];

    render(
      <MockAiChatProvider value={{
        chatState: { messages },
        uiState: { expandedReasoning },
      }}>
        <ChatMessages />
      </MockAiChatProvider>
    );

    expect(screen.getByTestId('message-2')).toBeInTheDocument();
  });
});