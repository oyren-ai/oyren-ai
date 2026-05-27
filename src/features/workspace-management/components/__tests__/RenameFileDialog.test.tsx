import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RenameFileDialog } from '../RenameFileDialog';
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

vi.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} {...props} />
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Loader2: () => <div data-testid="loader2-icon" />,
}));

describe('RenameFileDialog', () => {
  const mockFile: WorkspaceFile = {
    id: '1',
    workspace_id: 'workspace-1',
    file_name: 'test.pdf',
    file_path: '/path/to/test.pdf',
    added_at: '2024-01-01',
    last_accessed_at: '2024-01-01',
    is_visible: true,
    is_read_only: false,
  };

  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when file is null', () => {
    const { container } = render(
      <RenameFileDialog
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
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Rename File')).toBeInTheDocument();
    expect(screen.getByText(/Enter a new name for/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
    expect(screen.getByText('.pdf')).toBeInTheDocument();
  });

  it('initializes input with filename without extension', () => {
    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByDisplayValue('test');
    expect(input).toBeInTheDocument();
  });

  it('updates input value when user types', async () => {
    const user = userEvent.setup();

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'new-name');

    expect(input).toHaveValue('new-name');
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('successfully renames file with valid name', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValueOnce(undefined);

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'new-file-name');

    const renameButton = screen.getByRole('button', { name: /rename/i });
    await user.click(renameButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(mockFile, 'new-file-name.pdf');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('disables rename button when filename is empty', async () => {
    const user = userEvent.setup();

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);

    const renameButton = screen.getByRole('button', { name: /rename/i });
    expect(renameButton).toBeDisabled();
  });

  it('shows error for filename with invalid characters', async () => {
    const user = userEvent.setup();

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'invalid<>name');

    const renameButton = screen.getByRole('button', { name: /rename/i });
    await user.click(renameButton);

    expect(screen.getByText('File name contains invalid characters')).toBeInTheDocument();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('shows error for reserved filename', async () => {
    const user = userEvent.setup();

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'CON');

    const renameButton = screen.getByRole('button', { name: /rename/i });
    await user.click(renameButton);

    expect(screen.getByText('File name is reserved')).toBeInTheDocument();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('shows error for too long filename', async () => {
    const user = userEvent.setup();
    const longName = 'a'.repeat(300);

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    // Use fireEvent for long strings to avoid timeout (userEvent types char by char)
    await user.clear(input);
    // Directly set the value and fire change event for performance
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, longName);
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const renameButton = screen.getByRole('button', { name: /rename/i });
    await user.click(renameButton);

    expect(screen.getByText(/File name is too long/)).toBeInTheDocument();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('disables rename button when name is unchanged', () => {
    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const renameButton = screen.getByRole('button', { name: /rename/i });
    expect(renameButton).toBeDisabled();
  });

  it('shows loading state while renaming', async () => {
    const user = userEvent.setup();
    let resolveRename: ((value: void | PromiseLike<void>) => void) | undefined;
    mockOnConfirm.mockImplementation(
      () => new Promise<void>((resolve) => { resolveRename = resolve; })
    );

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'new-name');

    const renameButton = screen.getByRole('button', { name: /rename/i });
    await user.click(renameButton);

    expect(screen.getByText('Renaming...')).toBeInTheDocument();

    // Clean up: resolve the promise to prevent leaking into next test
    if (resolveRename) resolveRename();
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays error when rename fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'File already exists';
    mockOnConfirm.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'existing-file');

    const renameButton = screen.getByRole('button', { name: /rename/i });
    await user.click(renameButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles Enter key press to submit', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValueOnce(undefined);

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'new-name{Enter}');

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(mockFile, 'new-name.pdf');
    });
  });

  it('handles Escape key press to cancel', async () => {
    const user = userEvent.setup();

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents saving when loading', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'new-name');

    const renameButton = screen.getByRole('button', { name: /rename/i });
    await user.click(renameButton);

    expect(renameButton).toBeDisabled();
  });

  it('clears error when user types', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockRejectedValueOnce(new Error('Test error'));

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'new-name');

    const renameButton = screen.getByRole('button', { name: /rename/i });
    await user.click(renameButton);

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    await user.type(input, 'x');

    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
  });

  it('handles filename without extension', () => {
    const fileWithoutExt: WorkspaceFile = {
      ...mockFile,
      file_name: 'no-extension',
    };

    render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={fileWithoutExt}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByDisplayValue('no-extension')).toBeInTheDocument();
    expect(screen.queryByText('.')).not.toBeInTheDocument();
  });

  it('resets state when dialog closes', () => {
    const { rerender } = render(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    rerender(
      <RenameFileDialog
        isOpen={false}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    rerender(
      <RenameFileDialog
        isOpen={true}
        onClose={mockOnClose}
        file={mockFile}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
  });
});