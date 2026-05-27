import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatHistoryPopup } from '../ChatHistoryPopup';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    MessageSquare: () => <span data-testid="message-square-icon">MessageSquare</span>,
    Clock: () => <span data-testid="clock-icon">Clock</span>,
  };
});

// Mock useConversations hook
const mockUseConversations = vi.fn();
vi.mock('@/features/conversation-history/useConversations', () => ({
  useConversations: () => mockUseConversations()
}));

describe('ChatHistoryPopup', () => {
  const mockOnClose = vi.fn();
  const mockOnConversationSelect = vi.fn();
  const mockWorkspaceId = 'test-workspace-id';

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConversations.mockReturnValue({
      conversations: [],
      loading: false,
      reloadConversations: vi.fn()
    });
  });

  it('should not render when isOpen is false', () => {
    render(
      <ChatHistoryPopup
        isOpen={false}
        onClose={mockOnClose}
        workspaceId={mockWorkspaceId}
      />
    );

    expect(screen.queryByText('Chat History')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <ChatHistoryPopup
        isOpen={true}
        onClose={mockOnClose}
        workspaceId={mockWorkspaceId}
      />
    );

    expect(screen.getByText('Chat History')).toBeInTheDocument();
  });

  it('should render header with title', () => {
    render(
      <ChatHistoryPopup
        isOpen={true}
        onClose={mockOnClose}
        workspaceId={mockWorkspaceId}
      />
    );

    const header = screen.getByText('Chat History');
    expect(header).toBeInTheDocument();
    expect(header.tagName).toBe('H3');
  });

  it('should show loading state when conversations are loading', () => {
    mockUseConversations.mockReturnValue({
      conversations: [],
      loading: true,
      reloadConversations: vi.fn()
    });

    render(
      <ChatHistoryPopup
        isOpen={true}
        onClose={mockOnClose}
        workspaceId={mockWorkspaceId}
      />
    );

    expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
  });

  it('should show empty state when no conversations exist', () => {
    render(
      <ChatHistoryPopup
        isOpen={true}
        onClose={mockOnClose}
        workspaceId={mockWorkspaceId}
      />
    );

    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.getByText('Start chatting to see your history here')).toBeInTheDocument();
  });

  it('should render conversations from database', () => {
    const mockConversations = [
      {
        id: '1',
        title: 'Test Conversation 1',
        updated_at: new Date().toISOString(),
        workspace_id: mockWorkspaceId,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        created_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        is_pinned: false,
        is_archived: false,
        is_active: true
      },
      {
        id: '2',
        title: 'Test Conversation 2',
        updated_at: new Date().toISOString(),
        workspace_id: mockWorkspaceId,
        provider: 'deepseek',
        model: 'deepseek-v3',
        created_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        is_pinned: false,
        is_archived: false,
        is_active: true
      }
    ];

    mockUseConversations.mockReturnValue({
      conversations: mockConversations,
      loading: false,
      reloadConversations: vi.fn()
    });

    render(
      <ChatHistoryPopup
        isOpen={true}
        onClose={mockOnClose}
        workspaceId={mockWorkspaceId}
        onConversationSelect={mockOnConversationSelect}
      />
    );

    expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
    expect(screen.getByText('Test Conversation 2')).toBeInTheDocument();
  });

  it('should call onConversationSelect when conversation is clicked', () => {
    const mockConversations = [
      {
        id: 'conv-1',
        title: 'Clickable Conversation',
        updated_at: new Date().toISOString(),
        workspace_id: mockWorkspaceId,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        created_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        is_pinned: false,
        is_archived: false,
        is_active: true
      }
    ];

    mockUseConversations.mockReturnValue({
      conversations: mockConversations,
      loading: false,
      reloadConversations: vi.fn()
    });

    render(
      <ChatHistoryPopup
        isOpen={true}
        onClose={mockOnClose}
        workspaceId={mockWorkspaceId}
        onConversationSelect={mockOnConversationSelect}
      />
    );

    const conversationButton = screen.getByText('Clickable Conversation');
    fireEvent.click(conversationButton);

    expect(mockOnConversationSelect).toHaveBeenCalledWith('conv-1');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    render(
      <ChatHistoryPopup
        isOpen={true}
        onClose={mockOnClose}
        workspaceId={mockWorkspaceId}
      />
    );

    const backdrop = document.querySelector('.fixed.inset-0.z-40');
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should render footer with "View All History" button', () => {
    render(
      <ChatHistoryPopup
        isOpen={true}
        onClose={mockOnClose}
        workspaceId={mockWorkspaceId}
      />
    );

    expect(screen.getByText('View All History')).toBeInTheDocument();
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('should have correct structure with header, content, and footer', () => {
    const { container } = render(
      <ChatHistoryPopup
        isOpen={true}
        onClose={mockOnClose}
        workspaceId={mockWorkspaceId}
      />
    );

    expect(screen.getByText('Chat History')).toBeInTheDocument();

    const contentArea = container.querySelector('.max-h-96.overflow-y-auto');
    expect(contentArea).toBeInTheDocument();

    expect(screen.getByText('View All History')).toBeInTheDocument();
  });

  it('should have proper styling classes on dropdown', () => {
    const { container } = render(
      <ChatHistoryPopup
        isOpen={true}
        onClose={mockOnClose}
        workspaceId={mockWorkspaceId}
      />
    );

    const dropdown = container.querySelector('.absolute.top-14.left-4.w-80');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveClass('bg-background/80');
    expect(dropdown).toHaveClass('backdrop-blur-xl');
    expect(dropdown).toHaveClass('border');
    expect(dropdown).toHaveClass('rounded-lg');
  });
});
