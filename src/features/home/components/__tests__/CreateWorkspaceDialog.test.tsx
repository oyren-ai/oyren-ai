import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CreateWorkspaceDialog } from '../CreateWorkspaceDialog';
import { ViewNavigationProvider } from '@/contexts/NavigationContext.tsx';
import { AppProvider } from '@/contexts/AppContext.tsx';
import { workspaceApi } from '@/api/workspaceApi.ts';

// Mock workspace API
vi.mock('@/api/workspaceApi', () => ({
  workspaceApi: {
    create: vi.fn(),
  },
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

// Mock shadcn form components
vi.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} data-testid="input" {...props} />
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    (props, ref) => <textarea ref={ref} data-testid="textarea" {...props} />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) =>
    <label data-testid="label" {...props}>{children}</label>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
    <button data-testid="button" {...props}>{children}</button>,
}));

const mockNavigateToWorkspace = vi.fn();

// Mock NavigationContext
vi.mock('@/contexts/NavigationContext', async () => {
  const actual = await vi.importActual('@/contexts/NavigationContext');
  return {
    ...actual,
    useViewNavigation: () => ({
      navigateToWorkspace: mockNavigateToWorkspace,
      // Add other context values as needed
      activeItem: null,
      setActiveItem: vi.fn(),
      workspaces: [],
      setWorkspaces: vi.fn(),
    }),
    ViewNavigationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>
    <ViewNavigationProvider>
      {children}
    </ViewNavigationProvider>
  </AppProvider>
);

describe('CreateWorkspaceDialog', () => {
  const mockOnClose = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigateToWorkspace.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(
      <TestWrapper>
        <CreateWorkspaceDialog isOpen={false} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <TestWrapper>
        <CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Create New Workspace');
    expect(screen.getByPlaceholderText('Enter workspace name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter workspace description (optional)')).toBeInTheDocument();
  });

  it('should update input values when typing', async () => {
    render(
      <TestWrapper>
        <CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Enter workspace name');
    const descriptionInput = screen.getByPlaceholderText('Enter workspace description (optional)');

    await user.type(nameInput, 'My Workspace');
    await user.type(descriptionInput, 'This is a test workspace');

    expect(nameInput).toHaveValue('My Workspace');
    expect(descriptionInput).toHaveValue('This is a test workspace');
  });

  it('should show error when submitting with empty name', async () => {
    render(
      <TestWrapper>
        <CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const createButton = screen.getByText('Create');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Workspace name is required')).toBeInTheDocument();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(workspaceApi.create).not.toHaveBeenCalled();
  });

  it('should create workspace and navigate on successful submission', async () => {
    const mockWorkspace = { id: 'workspace-123' };
    (workspaceApi.create as any).mockResolvedValueOnce(mockWorkspace);

    render(
      <TestWrapper>
        <CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Enter workspace name');
    const descriptionInput = screen.getByPlaceholderText('Enter workspace description (optional)');
    const createButton = screen.getByText('Create');

    await user.type(nameInput, 'My Workspace');
    await user.type(descriptionInput, 'Test description');
    await user.click(createButton);

    await waitFor(() => {
      expect(workspaceApi.create).toHaveBeenCalledWith(
        'My Workspace',
        'Test description'
      );
    });

    await waitFor(() => {
      expect(mockNavigateToWorkspace).toHaveBeenCalledWith(mockWorkspace);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle workspace creation without description', async () => {
    const mockWorkspace = { id: 'workspace-456' };
    (workspaceApi.create as any).mockResolvedValueOnce(mockWorkspace);

    render(
      <TestWrapper>
        <CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Enter workspace name');
    const createButton = screen.getByText('Create');

    await user.type(nameInput, 'Workspace Without Description');
    await user.click(createButton);

    await waitFor(() => {
      expect(workspaceApi.create).toHaveBeenCalledWith(
        'Workspace Without Description',
        undefined
      );
    });

    await waitFor(() => {
      expect(mockNavigateToWorkspace).toHaveBeenCalledWith(mockWorkspace);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should show error when workspace creation fails', async () => {
    (workspaceApi.create as any).mockRejectedValueOnce(new Error('Creation failed'));

    render(
      <TestWrapper>
        <CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Enter workspace name');
    const createButton = screen.getByText('Create');

    await user.type(nameInput, 'Failed Workspace');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed: Creation failed/i)).toBeInTheDocument();
    });

    expect(mockNavigateToWorkspace).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should show loading state while creating workspace', async () => {
    const mockWorkspace = { id: 'workspace-789' };
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (workspaceApi.create as any).mockReturnValueOnce(promise);

    render(
      <TestWrapper>
        <CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Enter workspace name');
    const createButton = screen.getByText('Create');

    await user.type(nameInput, 'Loading Workspace');
    await user.click(createButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolvePromise!(mockWorkspace);

    await waitFor(() => {
      expect(mockNavigateToWorkspace).toHaveBeenCalledWith(mockWorkspace);
    });
  });

  it('should disable inputs and buttons while loading', async () => {
    const mockWorkspace = { id: 'workspace-999' };
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (workspaceApi.create as any).mockReturnValueOnce(promise);

    render(
      <TestWrapper>
        <CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Enter workspace name');
    const descriptionInput = screen.getByPlaceholderText('Enter workspace description (optional)');
    const createButton = screen.getByText('Create');
    const cancelButton = screen.getByText('Cancel');

    await user.type(nameInput, 'Test Workspace');
    await user.click(createButton);

    await waitFor(() => {
      expect(nameInput).toBeDisabled();
      expect(descriptionInput).toBeDisabled();
      expect(createButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    // Resolve to cleanup
    resolvePromise!(mockWorkspace);
  });

  it('should call onClose when Cancel button is clicked', async () => {
    render(
      <TestWrapper>
        <CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(workspaceApi.create).not.toHaveBeenCalled();
  });

  it('should trim whitespace from input values', async () => {
    const mockWorkspaceId = 'workspace-trim';
    (workspaceApi.create as any).mockResolvedValueOnce({ id: mockWorkspaceId });

    render(
      <TestWrapper>
        <CreateWorkspaceDialog isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Enter workspace name');
    const descriptionInput = screen.getByPlaceholderText('Enter workspace description (optional)');
    const createButton = screen.getByText('Create');

    await user.type(nameInput, '  Trimmed Workspace  ');
    await user.type(descriptionInput, '  Trimmed Description  ');
    await user.click(createButton);

    await waitFor(() => {
      expect(workspaceApi.create).toHaveBeenCalledWith(
        'Trimmed Workspace',
        'Trimmed Description'
      );
    });
  });
});