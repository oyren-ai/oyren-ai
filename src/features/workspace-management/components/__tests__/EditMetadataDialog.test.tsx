import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditMetadataDialog } from '../EditMetadataDialog';
import type { WorkspaceFile } from '@/types/workspace';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => <button ref={ref} {...props} />
  ),
}));

vi.mock('lucide-react', () => ({
  Code: () => <div data-testid="code-icon" />,
  Loader2: () => <div data-testid="loader2-icon" />,
}));

const mockGetWorkspaceFile = vi.fn();
const mockUpdateFileMetadata = vi.fn();
vi.mock('@/api/workspaceFilesApi', () => ({
  workspaceFilesApi: {
    getWorkspaceFile: (...args: unknown[]) => mockGetWorkspaceFile(...args),
    updateFileMetadata: (...args: unknown[]) => mockUpdateFileMetadata(...args),
  },
}));

const mockFile: WorkspaceFile = {
  id: 'file-1', workspace_id: 'ws-1', file_name: 'test.pdf',
  file_path: '/path/test.pdf', added_at: '2024-01-01',
  last_accessed_at: '2024-01-01', is_visible: true, is_read_only: false,
  metadata: '{"category":"scan"}',
};

describe('EditMetadataDialog', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetWorkspaceFile.mockResolvedValue({ ...mockFile });
  });

  it('returns null when file is null', () => {
    const { container } = render(
      <EditMetadataDialog isOpen={true} onClose={mockOnClose} file={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('fetches fresh data and pre-fills metadata', async () => {
    mockGetWorkspaceFile.mockResolvedValue({ ...mockFile, metadata: '{"fresh":true}' });
    render(<EditMetadataDialog isOpen={true} onClose={mockOnClose} file={mockFile} />);

    await waitFor(() => {
      const textarea = screen.getByTestId('metadata-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('{"fresh":true}');
    });
    expect(mockGetWorkspaceFile).toHaveBeenCalledWith('file-1', false);
  });

  it('falls back to prop metadata when fetch fails', async () => {
    mockGetWorkspaceFile.mockRejectedValue(new Error('Network'));
    render(<EditMetadataDialog isOpen={true} onClose={mockOnClose} file={mockFile} />);

    await waitFor(() => {
      const textarea = screen.getByTestId('metadata-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('{"category":"scan"}');
    });
  });

  it('saves valid JSON and dispatches event', async () => {
    const user = userEvent.setup();
    mockUpdateFileMetadata.mockResolvedValueOnce(undefined);
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<EditMetadataDialog isOpen={true} onClose={mockOnClose} file={mockFile} />);
    await waitFor(() => expect(screen.getByTestId('metadata-textarea')).toBeInTheDocument());

    const textarea = screen.getByTestId('metadata-textarea');
    await user.clear(textarea);
    await user.type(textarea, '{{"new":true}');

    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(mockUpdateFileMetadata).toHaveBeenCalledWith('file-1', '{"new":true}');
      expect(mockOnClose).toHaveBeenCalled();
    });
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'workspace-files-changed' })
    );
    dispatchSpy.mockRestore();
  });

  it('shows error for invalid JSON', async () => {
    const user = userEvent.setup();
    render(<EditMetadataDialog isOpen={true} onClose={mockOnClose} file={mockFile} />);
    await waitFor(() => expect(screen.getByTestId('metadata-textarea')).toBeInTheDocument());

    const textarea = screen.getByTestId('metadata-textarea');
    await user.clear(textarea);
    await user.type(textarea, 'not json');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
    expect(mockUpdateFileMetadata).not.toHaveBeenCalled();
  });

  it('saves null when textarea is empty', async () => {
    const user = userEvent.setup();
    mockUpdateFileMetadata.mockResolvedValueOnce(undefined);
    render(<EditMetadataDialog isOpen={true} onClose={mockOnClose} file={mockFile} />);
    await waitFor(() => expect(screen.getByTestId('metadata-textarea')).toBeInTheDocument());

    const textarea = screen.getByTestId('metadata-textarea');
    await user.clear(textarea);
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(mockUpdateFileMetadata).toHaveBeenCalledWith('file-1', null);
    });
  });

  it('shows error on API failure', async () => {
    const user = userEvent.setup();
    mockUpdateFileMetadata.mockRejectedValueOnce(new Error('Network error'));
    render(<EditMetadataDialog isOpen={true} onClose={mockOnClose} file={mockFile} />);
    await waitFor(() => expect(screen.getByTestId('metadata-textarea')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<EditMetadataDialog isOpen={true} onClose={mockOnClose} file={mockFile} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
