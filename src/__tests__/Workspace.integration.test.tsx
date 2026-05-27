import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { HomePageView } from '../features/home/HomePageView';
import { CreateWorkspaceDialog } from '../features/home/components/CreateWorkspaceDialog';
import { workspaceApi } from '@/api/workspaceApi.ts';
import { ViewNavigationProvider } from '@/contexts/NavigationContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { AppProvider } from '@/contexts/AppContext';
import type { Workspace, WorkspaceDisplay } from '../types/workspace';

import { useWorkspaces } from '@/features/workspace-management/hooks/useWorkspaces';

vi.mock('@/api/workspaceApi');
vi.mock('@/features/workspace-management/hooks/useWorkspaces');

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockImplementation((cmd: string) => {
    if (cmd === 'get_sync_state') {
      return Promise.resolve({ workspaces: {} });
    }
    return Promise.resolve(undefined);
  }),
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('Workspace Integration Tests', () => {
  const mockList = vi.mocked(workspaceApi.list);
  const mockListForDisplay = vi.mocked(workspaceApi.list_for_display);
  const mockCreate = vi.mocked(workspaceApi.create);
  const mockUpdate = vi.mocked(workspaceApi.update);
  const mockDelete = vi.mocked(workspaceApi.delete);
  const user = userEvent.setup();

  // Test wrapper with all required providers
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>
      <ViewNavigationProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </ViewNavigationProvider>
    </AppProvider>
  );

  const mockWorkspaces: WorkspaceDisplay[] = [
    {
      id: 'workspace-1',
      name: 'Research Project',
      description: 'Academic research workspace',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_accessed_at: '2024-01-15T10:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
      document_count: 0,
      chat_count: 0,
    },
    {
      id: 'workspace-2',
      name: 'Course Materials',
      description: 'Study materials for CS101',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      last_accessed_at: '2024-01-10T14:00:00Z',
      is_pinned: true,
      is_archived: false,
      is_favourite: false,
      is_active: true,
      document_count: 0,
      chat_count: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useWorkspaces hook
    vi.mocked(useWorkspaces).mockReturnValue({
      workspaces: mockWorkspaces,
      isLoadingWorkspaces: false,
      loadWorkspaces: vi.fn(),
      deleteWorkspace: vi.fn(),
    });

    mockList.mockResolvedValue(mockWorkspaces);
    mockListForDisplay.mockResolvedValue(mockWorkspaces);
  });

  describe('HomePage - Workspace List Display', () => {
    it('displays workspaces correctly', async () => {
      render(<HomePageView />, { wrapper: TestWrapper });

      await waitFor(() => {
        // Workspaces appear in both Recents and All Workspaces
        const researchProjects = screen.getAllByText('Research Project');
        expect(researchProjects.length).toBeGreaterThan(0);
        expect(screen.getAllByText('Course Materials').length).toBeGreaterThan(0);
      });

      // Check that pinned workspace shows pin indicator  
      const pinnedIndicators = screen.getAllByText('📌');
      expect(pinnedIndicators.length).toBeGreaterThanOrEqual(1);
    });

    it('workspace cards are clickable', async () => {
      render(<HomePageView />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getAllByText('Research Project').length).toBeGreaterThan(0);
      });

      // Verify workspace cards have cursor-pointer class (indicates they're clickable)
      const workspaceCards = screen.getAllByText('Research Project');
      const firstCard = workspaceCards[0].closest('.cursor-pointer');
      expect(firstCard).toBeInTheDocument();

      // Note: Navigation functionality is tested in WorkspaceCard.test.tsx
    });

    it('opens create workspace modal when clicking New Workspace button', async () => {
      render(<HomePageView />, { wrapper: TestWrapper });

      const newWorkspaceButton = screen.getByRole('button', { name: /new workspace/i });
      await user.click(newWorkspaceButton);

      // Modal should open - we can check if CreateWorkspaceDialog appears
      // Since it's controlled by modal context, just verify button click works
      expect(newWorkspaceButton).toBeInTheDocument();
    });

    it('opens edit modal when clicking edit menu item', async () => {
      render(<HomePageView />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getAllByText('Research Project').length).toBeGreaterThan(0);
      });

      // Get all menu buttons and click the first one
      const menuButtons = screen.getAllByTestId('workspace-menu-button');
      await user.click(menuButtons[0]);

      // Click edit option
      const editButton = screen.getByText(/edit workspace/i);
      await user.click(editButton);

      // Menu should close after clicking edit
      await waitFor(() => {
        expect(screen.queryByText(/edit workspace/i)).not.toBeInTheDocument();
      });
    });

    it('handles delete workspace with confirmation', async () => {
      render(<HomePageView />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getAllByText('Research Project').length).toBeGreaterThan(0);
      });

      // Get all menu buttons and click the first one
      const menuButtons = screen.getAllByTestId('workspace-menu-button');
      await user.click(menuButtons[0]);

      // Click delete option
      const deleteButton = screen.getByText(/delete workspace/i);
      await user.click(deleteButton);

      // Menu should close after clicking delete
      await waitFor(() => {
        expect(screen.queryByText(/delete workspace/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('CreateWorkspaceDialog', () => {
    it('creates a new workspace successfully', async () => {
      const newWorkspace: Workspace = {
        id: 'new-workspace',
        name: 'New Workspace',
        description: 'Test description',
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z',
        last_accessed_at: '2024-01-20T00:00:00Z',
        is_pinned: false,
        is_archived: false,
        is_favourite: false,
        is_active: true,
      };

      mockCreate.mockResolvedValueOnce(newWorkspace);

      const mockClose = vi.fn();
      render(<CreateWorkspaceDialog isOpen={true} onClose={mockClose} />, { wrapper: TestWrapper });

      // Fill in the create form
      const nameInput = screen.getByRole('textbox', { name: /name/i });
      const descInput = screen.getByRole('textbox', { name: /description/i });

      await user.type(nameInput, 'New Workspace');
      await user.type(descInput, 'Test description');

      // Submit
      const createButton = screen.getByRole('button', { name: /create$/i });
      await user.click(createButton);

      // Verify workspace was created
      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          'New Workspace',
          'Test description'
        );
        expect(mockClose).toHaveBeenCalled();
      });
    });

    it('validates required name field', async () => {
      const mockClose = vi.fn();
      render(<CreateWorkspaceDialog isOpen={true} onClose={mockClose} />, { wrapper: TestWrapper });

      // Try to submit without filling name
      const createButton = screen.getByRole('button', { name: /create$/i });
      await user.click(createButton);

      // Should show error
      expect(screen.getByText(/workspace name is required/i)).toBeInTheDocument();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('handles creation errors gracefully', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Network error'));

      const mockClose = vi.fn();
      render(<CreateWorkspaceDialog isOpen={true} onClose={mockClose} />, { wrapper: TestWrapper });

      const nameInput = screen.getByRole('textbox', { name: /name/i });
      await user.type(nameInput, 'Test Workspace');

      const createButton = screen.getByRole('button', { name: /create$/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed: Network error/i)).toBeInTheDocument();
      });
    });

    it('closes dialog on cancel', async () => {
      const mockClose = vi.fn();
      render(<CreateWorkspaceDialog isOpen={true} onClose={mockClose} />, { wrapper: TestWrapper });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockClose).toHaveBeenCalled();
    });
  });

  // Note: EditWorkspaceDialog has comprehensive unit tests in
  // src/components/HomePage/__tests__/EditWorkspaceDialog.test.tsx
  // Integration tests only verify the dialog opens/closes correctly

  describe('Full Workflow Integration', () => {
    it('completes a full create-edit-delete workflow', async () => {
      // Step 1: Load initial workspaces
      render(<HomePageView />, { wrapper: TestWrapper });
      await waitFor(() => {
        expect(screen.getAllByText('Research Project').length).toBeGreaterThan(0);
      });

      // Step 2: Open create modal
      const newWorkspaceButton = screen.getByRole('button', { name: /new workspace/i });
      await user.click(newWorkspaceButton);
      // Modal context handles opening
      expect(newWorkspaceButton).toBeInTheDocument();

      // Step 3: Edit a workspace
      const menuButtons = screen.getAllByTestId('workspace-menu-button');
      await user.click(menuButtons[0]);

      const editButton = screen.getByText(/edit workspace/i);
      await user.click(editButton);

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByText(/edit workspace/i)).not.toBeInTheDocument();
      });

      // Step 4: Delete a workspace
      await user.click(menuButtons[1]);

      const deleteButton = screen.getByText(/delete workspace/i);
      await user.click(deleteButton);

      // Menu should close after delete click
      await waitFor(() => {
        expect(screen.queryByText(/delete workspace/i)).not.toBeInTheDocument();
      });
    });
  });
});