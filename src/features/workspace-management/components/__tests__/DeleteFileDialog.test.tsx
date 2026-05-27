import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteFileDialog } from '../DeleteFileDialog';
import type { WorkspaceFile } from '@/types/workspace';

// Mock UI components - Dialog should NOT call onOpenChange automatically
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange?: (open: boolean) => void }) =>
    // Only render when open, do NOT call onOpenChange - let buttons handle that explicitly
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog-footer">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => <button ref={ref} {...props} />
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Cloud: () => <div data-testid="cloud-icon" />,
}));

describe('DeleteFileDialog', () => {
  const mockFile: WorkspaceFile = {
    id: '1',
    workspace_id: 'workspace-1',
    file_name: 'test.pdf',
    file_path: '/path/to/test.pdf',
    added_at: '2024-01-01',
    last_accessed_at: '2024-01-01',
    is_visible: true,
    is_read_only: false,
    local_status: 'active',
  };

  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when file is null', () => {
    const { container } = render(
      <DeleteFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={null}
        onConfirm={mockOnConfirm}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when file is provided', () => {
    render(
      <DeleteFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByRole('heading', { name: 'Remove from local' })).toBeInTheDocument();
    expect(screen.getByTestId('dialog-description')).toHaveTextContent(
      /Remove.*test\.pdf.*from this workspace/i,
    );
    expect(
      screen.getByText(/not synced to the cloud.*permanently removed from disk/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <DeleteFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when delete is successful', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValueOnce(undefined);

    render(
      <DeleteFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /remove file/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(mockFile);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows loading state while deleting', async () => {
    const user = userEvent.setup();
    let resolveDelete: () => void = () => {};
    mockOnConfirm.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = () => resolve();
        })
    );

    render(
      <DeleteFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /remove file/i });
    await user.click(deleteButton);

    expect(screen.getByText(/Removing/i)).toBeInTheDocument();

    // Resolve the deletion to avoid leaking async work into other tests
    resolveDelete();
    await waitFor(() => expect(mockOnConfirm).toHaveBeenCalled());
  });

  it('displays error message when delete fails with Error object', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Network error occurred';
    mockOnConfirm.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <DeleteFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /remove file/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('displays generic error message when delete fails with non-Error', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockRejectedValueOnce('Some string error');

    render(
      <DeleteFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /remove file/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete file')).toBeInTheDocument();
    });
  });

  it('prevents cancel when loading', async () => {
    const user = userEvent.setup();
    let resolveDelete: () => void = () => {};
    mockOnConfirm.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = () => resolve();
        })
    );

    render(
      <DeleteFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /remove file/i });
    await user.click(deleteButton);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();

    // Resolve the deletion to avoid leaking async work into other tests
    resolveDelete();
    await waitFor(() => expect(mockOnConfirm).toHaveBeenCalled());
  });

  it('clears error when cancel is clicked after error', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockRejectedValueOnce(new Error('Test error'));

    render(
      <DeleteFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /remove file/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
