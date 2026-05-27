import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EditWorkspaceDialog } from '../EditWorkspaceDialog';
import type { Workspace } from '@/types/workspace.ts';
import { workspaceApi } from '@/api/workspaceApi.ts';
import { useEditWorkspaceModal } from '@/contexts/ModalContext';

vi.mock('@/api/workspaceApi', () => ({
  workspaceApi: {
    update: vi.fn(),
  },
}));

// Mock the modal context
vi.mock('@/contexts/ModalContext', () => ({
  useEditWorkspaceModal: vi.fn(),
}));

describe('EditWorkspaceDialog', () => {
  const mockUpdate = vi.mocked(workspaceApi.update);
  const mockUseEditWorkspaceModal = vi.mocked(useEditWorkspaceModal);
  const mockOnClose = vi.fn();
  const user = userEvent.setup();

  const mockWorkspace: Workspace = {
    id: 'test-id',
    name: 'Test Workspace',
    description: 'Test description',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_accessed_at: '2024-01-01T00:00:00Z',
    is_pinned: false,
    is_archived: false,
    is_favourite: false,
    is_active: true,
  };

  beforeEach(() => {
    mockUpdate.mockClear();
    mockOnClose.mockClear();

    // Mock the modal context to provide the workspace
    mockUseEditWorkspaceModal.mockReturnValue({
      isOpen: true,
      open: vi.fn(),
      close: vi.fn(),
      data: { workspace: mockWorkspace },
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders with workspace data', () => {
    render(
      <EditWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByDisplayValue('Test Workspace')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('shows character count for title', () => {
    render(
      <EditWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('14/32')).toBeInTheDocument();
  });

  it('prevents entering title longer than 32 characters', async () => {
    render(
      <EditWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const titleInput = screen.getByRole('textbox', { name: /name/i });
    const longTitle = 'a'.repeat(33);

    await user.clear(titleInput);
    await user.type(titleInput, longTitle);

    // Should truncate to 32 characters
    expect((titleInput as HTMLInputElement).value).toHaveLength(32);
    expect(screen.getByText('32/32')).toBeInTheDocument();
  });

  it('prevents submitting empty title', async () => {
    render(
      <EditWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const titleInput = screen.getByRole('textbox', { name: /name/i });
    await user.clear(titleInput);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(screen.getByText(/workspace name is required/i)).toBeInTheDocument();
  });

  it('submits updated workspace data successfully', async () => {
    const updatedWorkspace = {
      ...mockWorkspace,
      name: 'Updated Name',
      description: 'Updated Description',
    };

    mockUpdate.mockResolvedValueOnce(updatedWorkspace);

    // Spy on window.dispatchEvent
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <EditWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const titleInput = screen.getByRole('textbox', { name: /name/i });
    const descInput = screen.getByRole('textbox', { name: /description/i });

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Name');

    await user.clear(descInput);
    await user.type(descInput, 'Updated Description');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        'test-id',
        'Updated Name',
        'Updated Description'
      );
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workspace-updated',
          detail: updatedWorkspace
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('submits only changed fields', async () => {
    const updatedWorkspace = {
      ...mockWorkspace,
      name: 'New Name',
    };

    mockUpdate.mockResolvedValueOnce(updatedWorkspace);

    render(
      <EditWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const titleInput = screen.getByRole('textbox', { name: /name/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'New Name');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        'test-id',
        'New Name',
        'Test description'
      );
    });
  });

  it('handles API errors gracefully', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('Update failed'));

    render(
      <EditWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const titleInput = screen.getByRole('textbox', { name: /name/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'New Name');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('closes dialog on cancel', async () => {
    render(
      <EditWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('shows loading state during update', async () => {
    mockUpdate.mockImplementationOnce(() =>
      new Promise((resolve) => setTimeout(() => resolve(mockWorkspace), 100))
    );

    render(
      <EditWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const titleInput = screen.getByRole('textbox', { name: /name/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'New Name');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    expect(screen.getByText(/saving/i)).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('allows clearing description', async () => {
    const updatedWorkspace = {
      ...mockWorkspace,
      description: undefined,
    };

    mockUpdate.mockResolvedValueOnce(updatedWorkspace);

    render(
      <EditWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const descInput = screen.getByRole('textbox', { name: /description/i });
    await user.clear(descInput);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        'test-id',
        'Test Workspace',
        null
      );
    });
  });

  it('trims whitespace from title', async () => {
    mockUpdate.mockResolvedValueOnce(mockWorkspace);

    render(
      <EditWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const titleInput = screen.getByRole('textbox', { name: /name/i });
    await user.clear(titleInput);
    await user.type(titleInput, '  Trimmed Title  ');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        'test-id',
        'Trimmed Title',
        'Test description'
      );
    });
  });
});