import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddFileDialog } from '../AddFileDialog';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    <p>{children}</p>,
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

vi.mock('lucide-react', () => ({
  FolderOpen: () => <span data-testid="icon-folder" />,
  Link: () => <span data-testid="icon-link" />,
  Loader2: () => <span data-testid="icon-loader" />,
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onBrowseFiles: vi.fn(),
  onDownloadFromUrl: vi.fn().mockResolvedValue(true),
  isDownloading: false,
  urlError: null as string | null,
  onUrlErrorReset: vi.fn(),
};

describe('AddFileDialog', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('does not render when closed', () => {
    const { container } = render(<AddFileDialog {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog title when open', () => {
    render(<AddFileDialog {...defaultProps} />);
    expect(screen.getByText('Add File')).toBeInTheDocument();
  });

  it('renders Browse Files button', () => {
    render(<AddFileDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
  });

  it('renders URL input', () => {
    render(<AddFileDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText(/paste pdf url/i)).toBeInTheDocument();
  });

  it('renders Import button', () => {
    render(<AddFileDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
  });

  it('calls onBrowseFiles and onClose on Browse click', async () => {
    const user = userEvent.setup();
    render(<AddFileDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /browse files/i }));
    expect(defaultProps.onBrowseFiles).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDownloadFromUrl with entered URL on Import click', async () => {
    const user = userEvent.setup();
    render(<AddFileDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/paste pdf url/i), 'https://example.com/paper.pdf');
    await user.click(screen.getByRole('button', { name: /import/i }));
    expect(defaultProps.onDownloadFromUrl).toHaveBeenCalledWith('https://example.com/paper.pdf');
  });

  it('shows Importing text when downloading', () => {
    render(<AddFileDialog {...defaultProps} isDownloading={true} />);
    expect(screen.getByText(/importing/i)).toBeInTheDocument();
  });

  it('displays URL error', () => {
    render(<AddFileDialog {...defaultProps} urlError="Invalid URL" />);
    expect(screen.getByText('Invalid URL')).toBeInTheDocument();
  });

  it('calls onUrlErrorReset when user types in URL input', async () => {
    const user = userEvent.setup();
    render(<AddFileDialog {...defaultProps} urlError="Some error" />);
    await user.type(screen.getByPlaceholderText(/paste pdf url/i), 'h');
    expect(defaultProps.onUrlErrorReset).toHaveBeenCalled();
  });

  it('disables Import button when URL is empty', () => {
    render(<AddFileDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /import/i })).toBeDisabled();
  });

  it('disables buttons when downloading', () => {
    render(<AddFileDialog {...defaultProps} isDownloading={true} />);
    expect(screen.getByRole('button', { name: /browse files/i })).toBeDisabled();
  });

  it('triggers import on Enter key in URL input', async () => {
    const user = userEvent.setup();
    render(<AddFileDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText(/paste pdf url/i);
    await user.type(input, 'https://example.com/paper.pdf{Enter}');
    expect(defaultProps.onDownloadFromUrl).toHaveBeenCalledWith('https://example.com/paper.pdf');
  });

  it('closes dialog and clears URL on successful import', async () => {
    const user = userEvent.setup();
    render(<AddFileDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/paste pdf url/i), 'https://example.com/paper.pdf');
    await user.click(screen.getByRole('button', { name: /import/i }));

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
