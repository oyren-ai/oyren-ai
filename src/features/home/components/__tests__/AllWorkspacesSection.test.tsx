import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AllWorkspacesSection from '../AllWorkspacesSection';
import type { WorkspaceDisplay } from '@/types/workspace';

// Mock the WorkspaceCard component
vi.mock('../WorkspaceCard', () => ({
  WorkspaceCard: ({ workspace }: { workspace: WorkspaceDisplay }) => (
    <div data-testid={`workspace-card-${workspace.id}`}>{workspace.name}</div>
  ),
}));

describe('AllWorkspacesSection', () => {
  const mockWorkspaces: WorkspaceDisplay[] = [
    {
      id: '1',
      name: 'Workspace 1',
      description: 'First workspace',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      last_accessed_at: '2024-01-20T00:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
      document_count: 5,
      chat_count: 3,
      lastAccessed: '1 day ago',
    },
    {
      id: '2',
      name: 'Workspace 2',
      description: 'Second workspace',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
      last_accessed_at: '2024-01-19T00:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
      document_count: 3,
      chat_count: 2,
      lastAccessed: '2 days ago',
    },
  ];

  it('renders section title with icon', () => {
    render(<AllWorkspacesSection workspaces={mockWorkspaces} />);

    expect(screen.getByText('All Workspaces')).toBeInTheDocument();
    // FolderOpen icon should be present
    const heading = screen.getByText('All Workspaces').parentElement;
    expect(heading).toBeInTheDocument();
  });

  it('renders all workspace cards', () => {
    render(<AllWorkspacesSection workspaces={mockWorkspaces} />);

    expect(screen.getByTestId('workspace-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-card-2')).toBeInTheDocument();
    expect(screen.getByText('Workspace 1')).toBeInTheDocument();
    expect(screen.getByText('Workspace 2')).toBeInTheDocument();
  });

  it('displays empty state when no workspaces', () => {
    render(<AllWorkspacesSection workspaces={[]} />);

    expect(screen.getByText('No workspaces yet.')).toBeInTheDocument();
    expect(screen.getByText('Create your first workspace to get started.')).toBeInTheDocument();
  });

  it('uses responsive grid layout', () => {
    const { container } = render(<AllWorkspacesSection workspaces={mockWorkspaces} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('md:grid-cols-3');
    expect(grid).toHaveClass('lg:grid-cols-4');
    expect(grid).toHaveClass('xl:grid-cols-5');
    expect(grid).toHaveClass('2xl:grid-cols-6');
  });

  it('passes callbacks to workspace cards', () => {
    const mockOnWorkspaceUpdated = vi.fn();
    const mockOnWorkspaceDeleted = vi.fn();

    render(
      <AllWorkspacesSection
        workspaces={mockWorkspaces}
      />
    );

    // Cards should be rendered
    expect(screen.getByTestId('workspace-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-card-2')).toBeInTheDocument();
  });

  it('has proper spacing and margin classes', () => {
    const { container } = render(<AllWorkspacesSection workspaces={mockWorkspaces} />);

    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('mb-8');
  });

  it('handles large number of workspaces', () => {
    const manyWorkspaces = Array.from({ length: 50 }, (_, i) => ({
      ...mockWorkspaces[0],
      id: `workspace-${i}`,
      name: `Workspace ${i}`,
    }));

    render(<AllWorkspacesSection workspaces={manyWorkspaces} />);

    // Should render all workspaces
    expect(screen.getByTestId('workspace-card-workspace-0')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-card-workspace-49')).toBeInTheDocument();
  });
});

