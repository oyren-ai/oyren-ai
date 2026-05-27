import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HomePageView } from '@/features/home/HomePageView';
import type { WorkspaceDisplay } from '@/types/workspace';

// Mock all dependencies
vi.mock('@/features/workspace-management/hooks/useWorkspaces');
vi.mock('@/features/home/components', () => ({
  LeftMiniBar: () => <div data-testid="left-mini-bar">LeftMiniBar</div>,
  TopBar: () => <div data-testid="top-bar">TopBar</div>,
  RecentsSection: ({ workspaces }: { workspaces: WorkspaceDisplay[] }) => (
    <div data-testid="recents-section">
      Recents: {workspaces.length} workspaces
    </div>
  ),
  AllWorkspacesSection: ({ workspaces }: { workspaces: WorkspaceDisplay[] }) => (
    <div data-testid="all-workspaces-section">
      All: {workspaces.length} workspaces
    </div>
  ),
}));

import { useWorkspaces } from '@/features/workspace-management/hooks/useWorkspaces';

describe('HomePageView', () => {
  const mockWorkspaces: WorkspaceDisplay[] = [
    {
      id: '1',
      name: 'Workspace 1',
      description: 'First workspace',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      last_accessed_at: '2024-01-20T10:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
      document_count: 5,
      chat_count: 3,
    },
    {
      id: '2',
      name: 'Workspace 2',
      description: 'Second workspace',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
      last_accessed_at: '2024-01-19T10:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
      document_count: 3,
      chat_count: 2,
    },
    {
      id: '3',
      name: 'Workspace 3',
      description: 'Third workspace',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-17T00:00:00Z',
      last_accessed_at: '2024-01-18T10:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
      document_count: 2,
      chat_count: 1,
    },
    {
      id: '4',
      name: 'Workspace 4',
      description: 'Fourth workspace',
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-18T00:00:00Z',
      last_accessed_at: '2024-01-17T10:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
      document_count: 1,
      chat_count: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useWorkspaces).mockReturnValue({
      workspaces: mockWorkspaces,
      isLoadingWorkspaces: false,
      loadWorkspaces: vi.fn(),
      deleteWorkspace: vi.fn(),
    });
  });

  it('renders all main components', () => {
    render(<HomePageView />);

    expect(screen.getByTestId('left-mini-bar')).toBeInTheDocument();
    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    expect(screen.getByTestId('recents-section')).toBeInTheDocument();
    expect(screen.getByTestId('all-workspaces-section')).toBeInTheDocument();
  });

  it('renders "Workspaces" heading', () => {
    render(<HomePageView />);

    expect(screen.getByText('Workspaces')).toBeInTheDocument();
  });

  it('passes first 3 workspaces to RecentsSection', () => {
    render(<HomePageView />);

    const recentsSection = screen.getByTestId('recents-section');
    expect(recentsSection).toHaveTextContent('Recents: 3 workspaces');
  });

  it('passes all workspaces to AllWorkspacesSection', () => {
    render(<HomePageView />);

    const allWorkspacesSection = screen.getByTestId('all-workspaces-section');
    expect(allWorkspacesSection).toHaveTextContent('All: 4 workspaces');
  });

  it('displays loading state when workspaces are loading', () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      workspaces: [],
      isLoadingWorkspaces: true,
      loadWorkspaces: vi.fn(),
      deleteWorkspace: vi.fn(),
    });

    render(<HomePageView />);

    expect(screen.getByText('Loading workspaces...')).toBeInTheDocument();
    expect(screen.queryByTestId('recents-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('all-workspaces-section')).not.toBeInTheDocument();
  });

  it('hides sections during loading', () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      workspaces: [],
      isLoadingWorkspaces: true,
      loadWorkspaces: vi.fn(),
      deleteWorkspace: vi.fn(),
    });

    render(<HomePageView />);

    expect(screen.queryByTestId('recents-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('all-workspaces-section')).not.toBeInTheDocument();
  });

  it('handles empty workspaces list', () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      workspaces: [],
      isLoadingWorkspaces: false,
      loadWorkspaces: vi.fn(),
      deleteWorkspace: vi.fn(),
    });

    render(<HomePageView />);

    const recentsSection = screen.getByTestId('recents-section');
    const allWorkspacesSection = screen.getByTestId('all-workspaces-section');

    expect(recentsSection).toHaveTextContent('Recents: 0 workspaces');
    expect(allWorkspacesSection).toHaveTextContent('All: 0 workspaces');
  });

  it('handles less than 3 workspaces for recents', () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      workspaces: [mockWorkspaces[0], mockWorkspaces[1]],
      isLoadingWorkspaces: false,
      loadWorkspaces: vi.fn(),
      deleteWorkspace: vi.fn(),
    });

    render(<HomePageView />);

    const recentsSection = screen.getByTestId('recents-section');
    expect(recentsSection).toHaveTextContent('Recents: 2 workspaces');
  });

  it('has proper layout structure', () => {
    const { container } = render(<HomePageView />);

    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass('flex');
    expect(mainContainer).toHaveClass('h-screen');
    expect(mainContainer).toHaveClass('bg-background');
  });

  it('main content area has proper classes', () => {
    const { container } = render(<HomePageView />);

    const mainContent = container.querySelector('.overflow-auto');
    expect(mainContent).toHaveClass('flex-1');
    expect(mainContent).toHaveClass('bg-neutral-50');
    expect(mainContent).toHaveClass('dark:bg-neutral-900');
  });

  it('reloads workspaces when workspace-updated event is dispatched', () => {
    const mockLoadWorkspaces = vi.fn();

    vi.mocked(useWorkspaces).mockReturnValue({
      workspaces: mockWorkspaces,
      isLoadingWorkspaces: false,
      loadWorkspaces: mockLoadWorkspaces,
      deleteWorkspace: vi.fn(),
    });

    render(<HomePageView />);

    // Dispatch the workspace-updated event
    window.dispatchEvent(new Event('workspace-updated'));

    // Verify loadWorkspaces was called
    expect(mockLoadWorkspaces).toHaveBeenCalledTimes(1);
  });

  it('cleans up workspace-updated event listener on unmount', () => {
    const mockLoadWorkspaces = vi.fn();

    vi.mocked(useWorkspaces).mockReturnValue({
      workspaces: mockWorkspaces,
      isLoadingWorkspaces: false,
      loadWorkspaces: mockLoadWorkspaces,
      deleteWorkspace: vi.fn(),
    });

    const { unmount } = render(<HomePageView />);

    // Unmount the component
    unmount();

    // Dispatch the event after unmount
    window.dispatchEvent(new Event('workspace-updated'));

    // Verify loadWorkspaces was NOT called (listener was removed)
    expect(mockLoadWorkspaces).not.toHaveBeenCalled();
  });
});

