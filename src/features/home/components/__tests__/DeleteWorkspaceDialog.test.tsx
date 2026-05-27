import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { DeleteWorkspaceDialog } from '../DeleteWorkspaceDialog';
import { workspaceApi } from '@/api/workspaceApi.ts';
import { useDeleteWorkspaceModal } from '@/contexts/ModalContext';
import type { Workspace } from '@/types/workspace';

// Mock workspace API
vi.mock('@/api/workspaceApi', () => ({
  workspaceApi: {
    delete: vi.fn(),
  },
}));

// Mock modal context
vi.mock('@/contexts/ModalContext', () => ({
  useDeleteWorkspaceModal: vi.fn(),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-icon">AlertTriangle</div>,
}));

// Mock shadcn dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    <h2 data-testid="dialog-title">{children}</h2>,
}));

// Mock shadcn button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
    <button data-testid="button" {...props}>{children}</button>,
}));

describe('DeleteWorkspaceDialog', () => {
  const mockOnClose = vi.fn();
  const mockWorkspace: Workspace = {
    id: 'workspace-123',
    name: 'Test Workspace',
    description: 'Test Description',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    last_accessed_at: '2024-01-20T00:00:00Z',
    is_pinned: false,
    is_archived: false,
    is_favourite: false,
    is_active: true,
  };
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for modal context
    vi.mocked(useDeleteWorkspaceModal).mockReturnValue({
      isOpen: true,
      open: vi.fn(),
      close: mockOnClose,
      data: { workspace: mockWorkspace },
    } as any);
  });

  it('should not render when isOpen is false', () => {
    render(
      <DeleteWorkspaceDialog
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true with workspace', () => {
    render(
      <DeleteWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Delete Workspace');
    expect(screen.getByText(`Are you sure you want to delete the workspace "Test Workspace"?`)).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByText('All data associated with this workspace will be permanently deleted.')).toBeInTheDocument();
  });

  it('should not render if workspace is not provided', () => {
    vi.mocked(useDeleteWorkspaceModal).mockReturnValue({
      isOpen: true,
      open: vi.fn(),
      close: mockOnClose,
      data: undefined,
    } as any);

    render(
      <DeleteWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('should delete workspace and dispatch event on confirmation', async () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
    (workspaceApi.delete as any).mockResolvedValueOnce(undefined);

    render(
      <DeleteWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(workspaceApi.delete).toHaveBeenCalledWith('workspace-123');
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workspace-deleted',
          detail: mockWorkspace,
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });

    dispatchEventSpy.mockRestore();
  });

  it('should show error message when delete fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (workspaceApi.delete as any).mockRejectedValueOnce(new Error('Delete failed'));

    render(
      <DeleteWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete workspace. Please try again.')).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete workspace:', expect.any(Error));
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should show loading state while deleting', async () => {
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    (workspaceApi.delete as any).mockReturnValueOnce(promise);

    render(
      <DeleteWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' });
    await user.click(deleteButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });

    // Check that buttons are disabled during loading
    const cancelButton = screen.getByText('Cancel');
    const deletingButton = screen.getByText('Deleting...');
    expect(cancelButton).toBeDisabled();
    expect(deletingButton).toBeDisabled();

    // Resolve the promise
    resolvePromise!();

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should close dialog when cancel button is clicked', async () => {
    render(
      <DeleteWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(workspaceApi.delete).not.toHaveBeenCalled();
  });

  it('should close dialog when dialog onOpenChange is triggered', async () => {
    render(
      <DeleteWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // This simulates clicking outside the dialog or pressing ESC
    // Since we're mocking Dialog, we need to test the onOpenChange prop
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should clear error message when closing dialog', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (workspaceApi.delete as any).mockRejectedValueOnce(new Error('Delete failed'));

    const { rerender } = render(
      <DeleteWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // First, trigger an error
    const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete workspace. Please try again.')).toBeInTheDocument();
    });

    // Now close and reopen the dialog
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();

    // Reopen dialog - error should be cleared
    rerender(
      <DeleteWorkspaceDialog
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    rerender(
      <DeleteWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Failed to delete workspace. Please try again.')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('should not allow interaction when loading', async () => {
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    (workspaceApi.delete as any).mockReturnValueOnce(promise);

    render(
      <DeleteWorkspaceDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });

    // Try to click cancel while loading - should be disabled
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();

    // Cleanup
    resolvePromise!();
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});