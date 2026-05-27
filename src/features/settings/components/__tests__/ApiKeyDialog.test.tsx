import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeyDialog } from '../ApiKeyDialog';
import * as aiProviderApi from '@/api/aiProviderApi';

// Mock ModalContext
const mockClose = vi.fn();
const mockData = {};
vi.mock('@/contexts/ModalContext', () => ({
  useApiKeyModal: () => ({
    data: mockData,
    close: mockClose,
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Eye: () => <span data-testid="eye-icon">Eye</span>,
    EyeOff: () => <span data-testid="eye-off-icon">EyeOff</span>,
  };
});

// Mock UI components for better test isolation
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

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) =>
    <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} {...props} />
  ),
}));

// Mock Select to be a simple native select that properly triggers callbacks
let selectOnValueChange: ((val: string) => void) | null = null;

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (val: string) => void }) => {
    selectOnValueChange = onValueChange;
    return <div data-testid="select-wrapper">{children}</div>;
  },
  SelectTrigger: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <select
      id={id}
      role="combobox"
      data-testid="select-trigger"
      onChange={(e) => {
        if (selectOnValueChange) {
          selectOnValueChange(e.target.value);
        }
      }}
    >
      <option value="">Select a provider</option>
      <option value="gemini">Gemini</option>
      <option value="deepseek">DeepSeek</option>
      <option value="openrouter">OpenRouter</option>
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => null,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => null,
  SelectValue: ({ placeholder }: { placeholder?: string }) => null,
}));

// Mock API
vi.mock('@/api/aiProviderApi', () => ({
  aiProviderApi: {
    create: vi.fn(),
  },
}));

describe('ApiKeyDialog - Create Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockData as any).mode = 'create';
  });

  it('should render create mode dialog', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.getByText('Add New API Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Provider')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toBeInTheDocument();
  });

  it('should have provider dropdown', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.getByLabelText('Provider')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should show eye icon to toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    const eyeButton = screen.getByRole('button', { name: /eye/i });
    expect(eyeButton).toBeInTheDocument();

    const input = screen.getByLabelText('API Key') as HTMLInputElement;
    expect(input.type).toBe('password');

    await user.click(eyeButton);
    expect(input.type).toBe('text');

    await user.click(eyeButton);
    expect(input.type).toBe('password');
  });

  it('should show validation error when fields are empty', async () => {
    const user = userEvent.setup();
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  it('should call API and dispatch event on successful creation', async () => {
    const user = userEvent.setup();
    const mockCreate = vi.fn().mockResolvedValue({
      id: '1',
      ai_provider: { id: 'gemini', name: 'gemini' },
      name: 'Test Key',
      key: 'test-key-value',
    });
    (aiProviderApi.aiProviderApi.create as any) = mockCreate;

    const eventSpy = vi.fn();
    window.addEventListener('api-key-created', eventSpy);

    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    // Select provider using native select
    const providerSelect = screen.getByRole('combobox');
    await user.selectOptions(providerSelect, 'gemini');

    // Fill in name
    const nameInput = screen.getByLabelText('Name');
    await user.type(nameInput, 'Test Key');

    // Fill in API key
    const keyInput = screen.getByLabelText('API Key');
    await user.type(keyInput, 'test-api-key-123');

    // Submit
    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });

    window.removeEventListener('api-key-created', eventSpy);
  });

  it('should show error message on API failure', async () => {
    const user = userEvent.setup();
    const mockCreate = vi.fn().mockRejectedValue(new Error('Database error'));
    (aiProviderApi.aiProviderApi.create as any) = mockCreate;

    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    // Select provider
    const providerSelect = screen.getByRole('combobox');
    await user.selectOptions(providerSelect, 'gemini');

    const nameInput = screen.getByLabelText('Name');
    await user.type(nameInput, 'Test');

    const keyInput = screen.getByLabelText('API Key');
    await user.type(keyInput, 'key123');

    // Submit
    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument();
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  it('should disable buttons while loading', async () => {
    const user = userEvent.setup();
    let resolveCreate: any;
    const mockCreate = vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolveCreate = resolve;
    }));
    (aiProviderApi.aiProviderApi.create as any) = mockCreate;

    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    // Select provider
    const providerSelect = screen.getByRole('combobox');
    await user.selectOptions(providerSelect, 'gemini');

    await user.type(screen.getByLabelText('Name'), 'Test');
    await user.type(screen.getByLabelText('API Key'), 'key');

    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    resolveCreate({ id: '1' });
  });

  it('should clear form when dialog closes', () => {
    const { rerender } = render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    // Close dialog
    rerender(<ApiKeyDialog isOpen={false} onClose={mockClose} />);

    // Reopen
    rerender(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    const keyInput = screen.getByLabelText('API Key') as HTMLInputElement;

    expect(nameInput.value).toBe('');
    expect(keyInput.value).toBe('');
  });
});

describe('ApiKeyDialog - Edit Mode', () => {
  const mockApiKey = {
    id: 'key-1',
    name: 'My Gemini Key',
    ai_provider: { id: 'gemini', name: 'Gemini' },
    key: 'hidden',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (mockData as any).mode = 'edit';
    (mockData as any).apiKey = mockApiKey;
  });

  it('should render edit mode dialog with apiKey data', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.getByText('Edit API Key')).toBeInTheDocument();
    expect(screen.getByText('Gemini')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('My Gemini Key');
  });

  it('should initialize name input with apiKey name', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(nameInput.value).toBe('My Gemini Key');
  });

  it('should update name input on user type', async () => {
    const user = userEvent.setup();
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Key Name');

    expect((nameInput as HTMLInputElement).value).toBe('Updated Key Name');
  });

  it('should call API update and dispatch event on successful save', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    (aiProviderApi.aiProviderApi as any).update = mockUpdate;

    const eventSpy = vi.fn();
    window.addEventListener('api-key-updated', eventSpy);

    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('key-1', 'New Name');
      expect(eventSpy).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });

    window.removeEventListener('api-key-updated', eventSpy);
  });

  it('should show error when name is empty', async () => {
    const user = userEvent.setup();
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a name')).toBeInTheDocument();
    });

    expect(mockClose).not.toHaveBeenCalled();
  });

  it('should show error message on API failure', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn().mockRejectedValue(new Error('Update failed'));
    (aiProviderApi.aiProviderApi as any).update = mockUpdate;

    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  it('should show loading state while saving', async () => {
    const user = userEvent.setup();
    let resolveSave: any;
    const mockUpdate = vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolveSave = resolve;
    }));
    (aiProviderApi.aiProviderApi as any).update = mockUpdate;

    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    resolveSave(undefined);
  });

  it('should not render provider dropdown or API key input in edit mode', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('API Key')).not.toBeInTheDocument();
  });
});

describe('ApiKeyDialog - View Mode', () => {
  const mockApiKey = {
    id: 'key-1',
    name: 'My DeepSeek Key',
    ai_provider: { id: 'deepseek', name: 'DeepSeek' },
    key: 'hidden',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockAiModels = [
    'deepseek-chat',
    'deepseek-coder',
    'deepseek-reasoner',
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (mockData as any).mode = 'view';
    (mockData as any).apiKey = mockApiKey;
    (mockData as any).aiModels = mockAiModels;
  });

  it('should render view mode dialog', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.getByText('AI Models')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByText('API Key Name')).toBeInTheDocument();
    expect(screen.getByText('Supported AI Models')).toBeInTheDocument();
  });

  it('should display provider name', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.getByText('DeepSeek')).toBeInTheDocument();
  });

  it('should display API key name', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.getByText('My DeepSeek Key')).toBeInTheDocument();
  });

  it('should display all AI models', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.getByText('deepseek-chat')).toBeInTheDocument();
    expect(screen.getByText('deepseek-coder')).toBeInTheDocument();
    expect(screen.getByText('deepseek-reasoner')).toBeInTheDocument();
  });

  it('should not render input fields in view mode', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('should not render Save or Create buttons in view mode', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument();
  });

  it('should show Cancel button in view mode', () => {
    render(<ApiKeyDialog isOpen={true} onClose={mockClose} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
});
