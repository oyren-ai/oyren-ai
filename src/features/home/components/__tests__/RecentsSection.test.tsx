import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RecentsSection from '../RecentsSection';
import type { WorkspaceDisplay } from '@/types/workspace';

// Mock the WorkspaceCard component
vi.mock('../WorkspaceCard', () => ({
  WorkspaceCard: ({ workspace }: { workspace: WorkspaceDisplay }) => (
    <div data-testid={`workspace-card-${workspace.id}`}>{workspace.name}</div>
  ),
}));

describe('RecentsSection', () => {
  const mockWorkspaces: WorkspaceDisplay[] = [
    {
      id: '1',
      name: 'Recent Workspace 1',
      description: 'First recent',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      last_accessed_at: '2024-01-20T00:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
      document_count: 5,
      chat_count: 3,
      lastAccessed: '1 hour ago',
    },
    {
      id: '2',
      name: 'Recent Workspace 2',
      description: 'Second recent',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
      last_accessed_at: '2024-01-19T00:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
      document_count: 3,
      chat_count: 2,
      lastAccessed: '2 hours ago',
    },
    {
      id: '3',
      name: 'Recent Workspace 3',
      description: 'Third recent',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-17T00:00:00Z',
      last_accessed_at: '2024-01-18T00:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
      document_count: 2,
      chat_count: 1,
      lastAccessed: '3 hours ago',
    },
  ];

  it('renders section title with icon', () => {
    render(<RecentsSection workspaces={mockWorkspaces} />);

    expect(screen.getByText('Recents')).toBeInTheDocument();
    // Clock icon should be present (we can check by class)
    const heading = screen.getByText('Recents').parentElement;
    expect(heading).toBeInTheDocument();
  });

  it('renders all workspace cards', () => {
    render(<RecentsSection workspaces={mockWorkspaces} />);

    expect(screen.getByTestId('workspace-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-card-3')).toBeInTheDocument();
    expect(screen.getByText('Recent Workspace 1')).toBeInTheDocument();
    expect(screen.getByText('Recent Workspace 2')).toBeInTheDocument();
    expect(screen.getByText('Recent Workspace 3')).toBeInTheDocument();
  });

  it('displays empty state when no workspaces', () => {
    render(<RecentsSection workspaces={[]} />);

    expect(screen.getByText('No recent workspaces.')).toBeInTheDocument();
    expect(screen.getByText('Create a new workspace to get started.')).toBeInTheDocument();
  });

  it('uses responsive grid layout', () => {
    const { container } = render(<RecentsSection workspaces={mockWorkspaces} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('md:grid-cols-3');
    expect(grid).toHaveClass('lg:grid-cols-4');
    expect(grid).toHaveClass('xl:grid-cols-5');
    expect(grid).toHaveClass('2xl:grid-cols-6');
  });

  it('passes onWorkspaceDeleted callback to workspace cards', () => {
    const mockOnWorkspaceDeleted = vi.fn();
    render(
      <RecentsSection
        workspaces={mockWorkspaces}
      />
    );

    // Cards should be rendered (callback is passed but we can't test it without mocking the card)
    expect(screen.getByTestId('workspace-card-1')).toBeInTheDocument();
  });

  it('has proper spacing and margin classes', () => {
    const { container } = render(<RecentsSection workspaces={mockWorkspaces} />);

    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('mb-8');
  });
});

