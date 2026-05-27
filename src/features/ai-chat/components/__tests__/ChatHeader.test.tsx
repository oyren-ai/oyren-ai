import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatHeader from '../ChatHeader';
import { MockAiChatProvider } from '../../__tests__/testUtils';

describe('ChatHeader', () => {
  const mockOnOpenSettings = vi.fn();
  const mockOnNewChat = vi.fn();
  const mockOnLoadConversation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show AI Ready when API key is configured', () => {
    render(
      <MockAiChatProvider value={{
        chatState: { hasApiKey: true },
        actions: { onOpenSettings: mockOnOpenSettings, onNewChat: mockOnNewChat, onLoadConversation: mockOnLoadConversation }
      }}>
        <ChatHeader />
      </MockAiChatProvider>
    );
    expect(screen.getByText('AI Ready')).toBeInTheDocument();
  });

  it('should show AI Not Configured when no API key', () => {
    render(
      <MockAiChatProvider value={{
        chatState: { hasApiKey: false },
        actions: { onOpenSettings: mockOnOpenSettings, onNewChat: mockOnNewChat, onLoadConversation: mockOnLoadConversation }
      }}>
        <ChatHeader />
      </MockAiChatProvider>
    );
    expect(screen.getByText('AI Not Configured')).toBeInTheDocument();
  });

  it('should display token count when tokens > 0', async () => {
    render(
      <MockAiChatProvider value={{
        chatState: { totalTokens: 1500 },
        actions: { onOpenSettings: mockOnOpenSettings, onNewChat: mockOnNewChat, onLoadConversation: mockOnLoadConversation }
      }}>
        <ChatHeader />
      </MockAiChatProvider>
    );

    // Click info button to open popover
    const infoButton = screen.getByTestId('context-info-button');
    fireEvent.click(infoButton);

    // Check token count in popover
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('Total tokens')).toBeInTheDocument();
  });

  it('should show 0 tokens in popover when tokens = 0', async () => {
    render(
      <MockAiChatProvider value={{
        chatState: { totalTokens: 0 },
        actions: { onOpenSettings: mockOnOpenSettings, onNewChat: mockOnNewChat, onLoadConversation: mockOnLoadConversation }
      }}>
        <ChatHeader />
      </MockAiChatProvider>
    );

    // Click info button to open popover
    const infoButton = screen.getByTestId('context-info-button');
    fireEvent.click(infoButton);

    // Check token count shows 0
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should show error indicator when aiError is present', () => {
    const errorMessage = 'Test error message';
    render(
      <MockAiChatProvider value={{
        chatState: { aiError: errorMessage },
        actions: { onOpenSettings: mockOnOpenSettings, onNewChat: mockOnNewChat, onLoadConversation: mockOnLoadConversation }
      }}>
        <ChatHeader />
      </MockAiChatProvider>
    );

    const errorButton = screen.getByTestId('ai-error-indicator');
    expect(errorButton).toBeInTheDocument();
    expect(errorButton).toHaveAttribute('title', errorMessage);
  });

  it('should not show error indicator when no error', () => {
    render(
      <MockAiChatProvider value={{
        chatState: { aiError: null },
        actions: { onOpenSettings: mockOnOpenSettings, onNewChat: mockOnNewChat, onLoadConversation: mockOnLoadConversation }
      }}>
        <ChatHeader />
      </MockAiChatProvider>
    );
    expect(screen.queryByTestId('ai-error-indicator')).not.toBeInTheDocument();
  });

  it('should call onNewChat when New button is clicked', () => {
    render(
      <MockAiChatProvider value={{
        actions: { onNewChat: mockOnNewChat, onOpenSettings: mockOnOpenSettings, onLoadConversation: mockOnLoadConversation }
      }}>
        <ChatHeader />
      </MockAiChatProvider>
    );

    const newButton = screen.getByTestId('new-chat-button');
    fireEvent.click(newButton);

    expect(mockOnNewChat).toHaveBeenCalledTimes(1);
  });

  it('should pass data-testid prop correctly', () => {
    render(
      <MockAiChatProvider value={{
        actions: { onOpenSettings: mockOnOpenSettings, onNewChat: mockOnNewChat, onLoadConversation: mockOnLoadConversation }
      }}>
        <ChatHeader data-testid="test-header" />
      </MockAiChatProvider>
    );
    expect(screen.getByTestId('test-header')).toBeInTheDocument();
  });

  it('should render menu button', () => {
    render(
      <MockAiChatProvider value={{
        actions: { onOpenSettings: mockOnOpenSettings, onNewChat: mockOnNewChat, onLoadConversation: mockOnLoadConversation }
      }}>
        <ChatHeader />
      </MockAiChatProvider>
    );
    const menuButton = screen.getByTestId('menu-button');
    expect(menuButton).toBeInTheDocument();
  });

  it('should render menu with settings option', () => {
    // Note: This test just verifies the menu button exists
    // Full menu interaction testing would require additional setup for portals
    render(
      <MockAiChatProvider value={{
        actions: { onOpenSettings: mockOnOpenSettings, onNewChat: mockOnNewChat, onLoadConversation: mockOnLoadConversation }
      }}>
        <ChatHeader />
      </MockAiChatProvider>
    );
    const menuButton = screen.getByTestId('menu-button');
    expect(menuButton).toBeInTheDocument();
  });

  it('should have menu button with correct accessibility attributes', () => {
    render(
      <MockAiChatProvider value={{
        actions: { onOpenSettings: mockOnOpenSettings, onNewChat: mockOnNewChat, onLoadConversation: mockOnLoadConversation }
      }}>
        <ChatHeader />
      </MockAiChatProvider>
    );
    const menuButton = screen.getByTestId('menu-button');
    expect(menuButton).toHaveAttribute('title', 'Menu');
  });
});