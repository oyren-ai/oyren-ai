import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceCard } from '../WorkspaceCard';
import type { WorkspaceDisplay } from '@/types/workspace';

vi.mock('@/contexts/NavigationContext');
vi.mock('@/contexts/ModalContext');

import { useViewNavigation } from '@/contexts/NavigationContext';
import { useDeleteWorkspaceModal, useEditWorkspaceModal, useCloudSyncModal } from '@/contexts/ModalContext';

vi.mock('@/features/home/hooks/useWorkspaceCloudLinked', () => ({
  useWorkspaceCloudLinked: () => false,
}));

describe('WorkspaceCard (New)', () => {
  const mockWorkspace: WorkspaceDisplay = {
    id: '1',
    name: 'Test Workspace',
    description: 'Test description',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    last_accessed_at: '2024-01-20T00:00:00Z',
    is_pinned: false,
    is_archived: false,
    is_favourite: false,
    is_active: true,
    document_count: 5,
    chat_count: 3,
    lastAccessed: '2 hours ago',
  };

  const mockNavigateToWorkspace = vi.fn();
  const mockDeleteWorkspaceModalOpen = vi.fn();
  const mockEditWorkspaceModalOpen = vi.fn();
  const mockCloudSyncModalOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useViewNavigation).mockReturnValue({
      currentView: 'home-page',
      selectedWorkspace: null,
      navigateToWorkspace: mockNavigateToWorkspace,
      navigateToHome: vi.fn(),
      navigateBack: vi.fn(),
      navigateToSettings: vi.fn(),
      settingsTab: null,
      clearSettingsTab: vi.fn(),
    });

    vi.mocked(useDeleteWorkspaceModal).mockReturnValue({
      open: mockDeleteWorkspaceModalOpen,
      close: vi.fn(),
      isOpen: false,
      data: undefined,
    });

    vi.mocked(useEditWorkspaceModal).mockReturnValue({
      open: mockEditWorkspaceModalOpen,
      close: vi.fn(),
      isOpen: false,
      data: undefined,
    });

    vi.mocked(useCloudSyncModal).mockReturnValue({
      open: mockCloudSyncModalOpen,
      close: vi.fn(),
      isOpen: false,
      data: undefined,
    });
  });

  it('renders workspace information correctly', () => {
    render(<WorkspaceCard workspace={mockWorkspace} />);

    expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    expect(screen.getByText('5 PDFs')).toBeInTheDocument();
    expect(screen.getByText('3 Chats')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('navigates to workspace when card is clicked', () => {
    render(<WorkspaceCard workspace={mockWorkspace} />);

    const card = screen.getByText('Test Workspace').closest('div.cursor-pointer');
    fireEvent.click(card!);

    expect(mockNavigateToWorkspace).toHaveBeenCalledTimes(1);
    expect(mockNavigateToWorkspace).toHaveBeenCalledWith(mockWorkspace);
  });

  it('displays pinned and favourite badges', () => {
    const pinnedWorkspace = { ...mockWorkspace, is_pinned: true, is_favourite: true };
    render(<WorkspaceCard workspace={pinnedWorkspace} />);

    expect(screen.getByText('📌')).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('opens menu when menu button is clicked', () => {
    render(<WorkspaceCard workspace={mockWorkspace} />);

    const menuButton = screen.getByLabelText('Workspace options');
    fireEvent.click(menuButton);

    expect(screen.getByText('Edit Workspace')).toBeInTheDocument();
    expect(screen.getByText('Sync with cloud')).toBeInTheDocument();
    expect(screen.getByText('Delete Workspace')).toBeInTheDocument();
  });

  it('opens cloud sync modal when sync button is clicked', () => {
    render(<WorkspaceCard workspace={mockWorkspace} />);

    const menuButton = screen.getByLabelText('Workspace options');
    fireEvent.click(menuButton);

    const syncButton = screen.getByText('Sync with cloud');
    fireEvent.click(syncButton);

    expect(mockCloudSyncModalOpen).toHaveBeenCalledTimes(1);
    expect(mockCloudSyncModalOpen).toHaveBeenCalledWith({ workspace: mockWorkspace });
  });

  it('closes menu when backdrop is clicked', () => {
    render(<WorkspaceCard workspace={mockWorkspace} />);

    const menuButton = screen.getByLabelText('Workspace options');
    fireEvent.click(menuButton);

    expect(screen.getByText('Edit Workspace')).toBeInTheDocument();

    const backdrop = screen.getByText('Edit Workspace').parentElement!.previousSibling as HTMLElement;
    fireEvent.click(backdrop);

    expect(screen.queryByText('Edit Workspace')).not.toBeInTheDocument();
  });

  it('opens delete modal when delete button is clicked', () => {
    render(<WorkspaceCard workspace={mockWorkspace} />);

    const menuButton = screen.getByLabelText('Workspace options');
    fireEvent.click(menuButton);

    const deleteButton = screen.getByText('Delete Workspace');
    fireEvent.click(deleteButton);

    expect(mockDeleteWorkspaceModalOpen).toHaveBeenCalledTimes(1);
    expect(mockDeleteWorkspaceModalOpen).toHaveBeenCalledWith({ workspace: mockWorkspace });
  });

  it('stops propagation when menu is clicked', () => {
    render(
      <div onClick={vi.fn()}>
        <WorkspaceCard workspace={mockWorkspace} />
      </div>
    );

    const menuButton = screen.getByLabelText('Workspace options');
    fireEvent.click(menuButton);

    expect(mockNavigateToWorkspace).not.toHaveBeenCalled();
  });

  it('displays "Never accessed" when lastAccessed is not provided', () => {
    const workspaceWithoutAccess = { ...mockWorkspace, lastAccessed: undefined };
    render(<WorkspaceCard workspace={workspaceWithoutAccess} />);

    expect(screen.getByText('Never accessed')).toBeInTheDocument();
  });

  it('has proper hover and transition classes', () => {
    const { container } = render(<WorkspaceCard workspace={mockWorkspace} />);

    const card = container.querySelector('.cursor-pointer');
    expect(card).toHaveClass('hover:shadow-lg');
    expect(card).toHaveClass('hover:scale-[1.02]');
    expect(card).toHaveClass('transition-all');
  });

  it('displays singular form for 1 PDF and 1 Chat', () => {
    const singleItemWorkspace = { ...mockWorkspace, document_count: 1, chat_count: 1 };
    render(<WorkspaceCard workspace={singleItemWorkspace} />);

    expect(screen.getByText('1 PDF')).toBeInTheDocument();
    expect(screen.getByText('1 Chat')).toBeInTheDocument();
  });

  it('displays plural form for multiple PDFs and Chats', () => {
    const multipleItemsWorkspace = { ...mockWorkspace, document_count: 5, chat_count: 3 };
    render(<WorkspaceCard workspace={multipleItemsWorkspace} />);

    expect(screen.getByText('5 PDFs')).toBeInTheDocument();
    expect(screen.getByText('3 Chats')).toBeInTheDocument();
  });
});
