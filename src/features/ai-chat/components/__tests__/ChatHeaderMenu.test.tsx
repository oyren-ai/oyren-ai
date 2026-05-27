import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatHeaderMenu } from '../ChatHeaderMenu';

// Mock the useConversations hook
vi.mock('@/features/conversation-history/useConversations', () => ({
  useConversations: vi.fn(() => ({
    conversations: [
      {
        id: 'conv1',
        title: 'Test Conversation 1',
        updated_at: new Date('2024-01-19T12:00:00Z').toISOString(),
        workspace_id: 'workspace1',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        created_at: new Date('2024-01-19T12:00:00Z').toISOString(),
        last_accessed_at: new Date('2024-01-19T12:00:00Z').toISOString(),
        is_pinned: false,
        is_archived: false,
        is_active: true,
      },
      {
        id: 'conv2',
        title: 'Test Conversation 2',
        updated_at: new Date('2024-01-18T12:00:00Z').toISOString(),
        workspace_id: 'workspace1',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        created_at: new Date('2024-01-18T12:00:00Z').toISOString(),
        last_accessed_at: new Date('2024-01-18T12:00:00Z').toISOString(),
        is_pinned: false,
        is_archived: false,
        is_active: false,
      },
    ],
    loading: false,
  })),
}));

// Mock time utils
vi.mock('@/utils/time-utils', () => ({
  formatRelativeTime: vi.fn((date: string) => '2 hours ago'),
}));

describe('ChatHeaderMenu', () => {
  const mockProps = {
    workspaceId: 'workspace1',
    onConvertToNote: vi.fn(),
    onOpenSettings: vi.fn(),
    onConversationSelect: vi.fn(),
    onViewFullHistory: vi.fn(),
    isConverting: false,
    hasMessages: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render menu trigger button', () => {
    render(
      <ChatHeaderMenu {...mockProps}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    expect(screen.getByTestId('menu-trigger')).toBeInTheDocument();
  });

  it('should display recent conversations when menu is opened', async () => {
    const user = userEvent.setup();
    render(
      <ChatHeaderMenu {...mockProps}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Recent Conversations')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
    expect(screen.getByText('Test Conversation 2')).toBeInTheDocument();
  });


  it('should call onConversationSelect when conversation is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ChatHeaderMenu {...mockProps}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
    });

    const conversation = screen.getByText('Test Conversation 1');
    await user.click(conversation);

    expect(mockProps.onConversationSelect).toHaveBeenCalledWith('conv1');
  });

  it('should call onViewFullHistory when "See Full History" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ChatHeaderMenu {...mockProps}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('See Full History')).toBeInTheDocument();
    });

    const viewHistoryButton = screen.getByText('See Full History');
    await user.click(viewHistoryButton);

    expect(mockProps.onViewFullHistory).toHaveBeenCalledTimes(1);
  });

  it('should call onConvertToNote when "Save as Markdown Note" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ChatHeaderMenu {...mockProps}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Save as Markdown Note')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save as Markdown Note');
    await user.click(saveButton);

    expect(mockProps.onConvertToNote).toHaveBeenCalledTimes(1);
  });

  it('should disable "Save as Markdown Note" when no messages', async () => {
    const user = userEvent.setup();
    const propsWithoutMessages = {
      ...mockProps,
      hasMessages: false,
    };

    render(
      <ChatHeaderMenu {...propsWithoutMessages}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    await waitFor(() => {
      const saveButton = screen.getByText('Save as Markdown Note').closest('div');
      expect(saveButton).toHaveAttribute('data-disabled');
    });
  });

  it('should disable "Save as Markdown Note" when converting', async () => {
    const user = userEvent.setup();
    const propsConverting = {
      ...mockProps,
      isConverting: true,
    };

    render(
      <ChatHeaderMenu {...propsConverting}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    await waitFor(() => {
      const saveButton = screen.getByText('Save as Markdown Note').closest('div');
      expect(saveButton).toHaveAttribute('data-disabled');
    });
  });

  it('should call onOpenSettings when Settings is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ChatHeaderMenu {...mockProps}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    const settingsButton = screen.getByText('Settings');
    await user.click(settingsButton);

    expect(mockProps.onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('should show "No conversations yet" when no conversations', async () => {
    const user = userEvent.setup();
    const { useConversations } = await import('@/features/conversation-history/useConversations');
    vi.mocked(useConversations).mockReturnValue({
      conversations: [],
      loading: false,
    });

    render(
      <ChatHeaderMenu {...mockProps}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    });
  });

  it('should show loading state when conversations are loading', async () => {
    const user = userEvent.setup();
    const { useConversations } = await import('@/features/conversation-history/useConversations');
    vi.mocked(useConversations).mockReturnValue({
      conversations: [],
      loading: true,
    });

    render(
      <ChatHeaderMenu {...mockProps}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('should limit recent conversations to 3', async () => {
    const user = userEvent.setup();
    const { useConversations } = await import('@/features/conversation-history/useConversations');
    vi.mocked(useConversations).mockReturnValue({
      conversations: [
        { id: '1', title: 'Conv 1', updated_at: new Date().toISOString() } as any,
        { id: '2', title: 'Conv 2', updated_at: new Date().toISOString() } as any,
        { id: '3', title: 'Conv 3', updated_at: new Date().toISOString() } as any,
        { id: '4', title: 'Conv 4', updated_at: new Date().toISOString() } as any,
        { id: '5', title: 'Conv 5', updated_at: new Date().toISOString() } as any,
      ],
      loading: false,
    });

    render(
      <ChatHeaderMenu {...mockProps}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Conv 1')).toBeInTheDocument();
      expect(screen.getByText('Conv 2')).toBeInTheDocument();
      expect(screen.getByText('Conv 3')).toBeInTheDocument();
    });

    expect(screen.queryByText('Conv 4')).not.toBeInTheDocument();
    expect(screen.queryByText('Conv 5')).not.toBeInTheDocument();
  });

  it('should open report page when "Report Issue" is clicked', async () => {
    const user = userEvent.setup();
    const mockInvoke = (global as any).mockInvoke;

    render(
      <ChatHeaderMenu {...mockProps}>
        <button data-testid="menu-trigger">Menu</button>
      </ChatHeaderMenu>
    );

    const trigger = screen.getByTestId('menu-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Report Issue')).toBeInTheDocument();
    });

    const reportButton = screen.getByText('Report Issue');
    await user.click(reportButton);

    expect(mockInvoke).toHaveBeenCalledWith('open_url_in_browser', { url: 'https://oyren.ai/report' });
  });
});