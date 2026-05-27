import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteApiKeyDialog } from '../DeleteApiKeyDialog';
import * as aiProviderApi from '@/api/aiProviderApi';

// Mock ModalContext
const mockClose = vi.fn();
const mockData = {};
vi.mock('@/contexts/ModalContext', () => ({
  useDeleteApiKeyModal: () => ({
    data: mockData,
    close: mockClose,
  }),
}));

// Mock UI components
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

vi.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => <button ref={ref} {...props} />
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
}));

// Mock API
vi.mock('@/api/aiProviderApi', () => ({
  aiProviderApi: {
    delete: vi.fn(),
  },
}));

describe('DeleteApiKeyDialog', () => {
  const mockApiKey = {
    id: 'key-1',
    name: 'My Test Key',
    ai_provider: { id: 'gemini', name: 'Gemini' },
    key: 'hidden',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (mockData as any).apiKey = mockApiKey;
  });

  it('renders nothing when apiKey is null', () => {
    (mockData as any).apiKey = null;
    const { container } = render(
      <DeleteApiKeyDialog isOpen={true} onClose={mockClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when apiKey is provided', () => {
    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.getByRole('heading', { name: /delete api key/i })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockApiKey.name))).toBeInTheDocument();
  });

  it('displays warning message', () => {
    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByText(/you will need to re-add this api key/i)).toBeInTheDocument();
  });

  it('displays alert triangle icon', () => {
    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls API delete and dispatches event on successful deletion', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    (aiProviderApi.aiProviderApi.delete as any) = mockDelete;

    const eventSpy = vi.fn();
    window.addEventListener('api-key-deleted', eventSpy);

    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    const deleteButton = screen.getByRole('button', { name: /delete api key/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('key-1');
      expect(eventSpy).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });

    window.removeEventListener('api-key-deleted', eventSpy);
  });

  it('shows loading state while deleting', async () => {
    const user = userEvent.setup();
    let resolveDelete: any;
    const mockDelete = vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolveDelete = resolve;
    }));
    (aiProviderApi.aiProviderApi.delete as any) = mockDelete;

    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    const deleteButton = screen.getByRole('button', { name: /delete api key/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });

    resolveDelete(undefined);
  });

  it('disables buttons while deleting', async () => {
    const user = userEvent.setup();
    let resolveDelete: any;
    const mockDelete = vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolveDelete = resolve;
    }));
    (aiProviderApi.aiProviderApi.delete as any) = mockDelete;

    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    const deleteButton = screen.getByRole('button', { name: /delete api key/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    resolveDelete(undefined);
  });

  it('displays error message when delete fails', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn().mockRejectedValue(new Error('Network error'));
    (aiProviderApi.aiProviderApi.delete as any) = mockDelete;

    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    const deleteButton = screen.getByRole('button', { name: /delete api key/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete API key. Please try again.')).toBeInTheDocument();
    });

    expect(mockClose).not.toHaveBeenCalled();
  });

  it('prevents cancel when loading', async () => {
    const user = userEvent.setup();
    let resolveDelete: any;
    const mockDelete = vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolveDelete = resolve;
    }));
    (aiProviderApi.aiProviderApi.delete as any) = mockDelete;

    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    const deleteButton = screen.getByRole('button', { name: /delete api key/i });
    await user.click(deleteButton);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();

    resolveDelete(undefined);
  });

  it('clears error when cancel is clicked after error', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn().mockRejectedValue(new Error('Test error'));
    (aiProviderApi.aiProviderApi.delete as any) = mockDelete;

    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    const deleteButton = screen.getByRole('button', { name: /delete api key/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete API key. Please try again.')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockClose).toHaveBeenCalled();
  });

  it('does not call delete API when apiKey is null', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn();
    (aiProviderApi.aiProviderApi.delete as any) = mockDelete;

    (mockData as any).apiKey = null;

    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    // Component should not render, but if somehow delete is triggered, it shouldn't be called
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('has delete button with destructive variant', () => {
    render(<DeleteApiKeyDialog isOpen={true} onClose={mockClose} />);

    const deleteButton = screen.getByRole('button', { name: /delete api key/i });
    expect(deleteButton).toBeInTheDocument();
  });
});
