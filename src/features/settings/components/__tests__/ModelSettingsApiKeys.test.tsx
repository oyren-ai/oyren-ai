import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelSettingsApiKeys } from '../ModelSettingsApiKeys';

// Mock ModalContext
vi.mock('@/contexts/ModalContext', () => ({
  useApiKeyModal: () => ({
    open: vi.fn(),
  }),
  useDeleteApiKeyModal: () => ({
    open: vi.fn(),
  }),
}));

// Mock API
const mockList = vi.fn();
vi.mock('@/api/aiProviderApi', () => ({
  aiProviderApi: {
    list: () => mockList(),
  },
}));

// Mock activeProviderKeyStorage
vi.mock('@/features/ai-chat/utils/activeProviderKeyStorage', () => ({
  getActiveProviderKeyId: () => null,
  setActiveProviderKeyId: vi.fn(),
  clearActiveProviderKeyId: vi.fn(),
  ACTIVE_PROVIDER_KEY_EVENT: 'active-provider-key-changed',
}));

// Mock ApiKeyCard
vi.mock('../ApiKeyCard', () => ({
  ApiKeyCard: ({ apiKey, onClick, isSelected }: any) => (
    <div data-testid={`api-key-card-${apiKey.id}`} onClick={onClick}>
      <span>{apiKey.name}</span>
      <span data-testid={`selected-${apiKey.id}`}>{isSelected ? 'selected' : 'not-selected'}</span>
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Key: () => <span data-testid="key-icon">Key</span>,
    Plus: () => <span data-testid="plus-icon">Plus</span>,
    MoreHorizontal: () => <span>More</span>,
    Edit: () => <span>Edit</span>,
    Trash2: () => <span>Trash</span>,
  };
});

const mockApiProviderKeys = [
  {
    id: "1",
    ai_provider: { id: "openrouter", name: "openrouter", created_at: "2024-01-01T00:00:00Z" },
    name: "OpenRouter Production",
    key: "sk-or-v1-••••",
    date_added: "2024-01-15T10:30:00Z",
    last_used_date: "2024-01-20T14:20:00Z"
  },
  {
    id: "2",
    ai_provider: { id: "gemini", name: "gemini", created_at: "2024-01-01T00:00:00Z" },
    name: "Gemini Development",
    key: "AIzaSy••••",
    date_added: "2024-01-10T08:15:00Z",
    last_used_date: null
  },
  {
    id: "3",
    ai_provider: { id: "deepseek", name: "deepseek", created_at: "2024-01-01T00:00:00Z" },
    name: "DeepSeek Testing",
    key: "sk-••••",
    date_added: "2024-01-18T16:45:00Z",
    last_used_date: "2024-01-19T09:30:00Z"
  }
];

describe('ModelSettingsApiKeys', () => {
  const mockOnProviderSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(mockApiProviderKeys);
  });

  it('should render API Keys card', async () => {
    render(
      <ModelSettingsApiKeys onProviderSelect={mockOnProviderSelect} selectedProviderId={null} />
    );
    expect(screen.getByText('API Keys')).toBeInTheDocument();
    expect(screen.getByText('Configure your AI service provider API keys')).toBeInTheDocument();
    expect(screen.getByTestId('key-icon')).toBeInTheDocument();
  });

  it('should render Add Key button', async () => {
    render(
      <ModelSettingsApiKeys onProviderSelect={mockOnProviderSelect} selectedProviderId={null} />
    );
    const addButton = screen.getByRole('button', { name: /add key/i });
    expect(addButton).toBeInTheDocument();
  });

  it('should render Plus icon in Add Key button', async () => {
    render(
      <ModelSettingsApiKeys onProviderSelect={mockOnProviderSelect} selectedProviderId={null} />
    );
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });

  it('should render all API key cards from database', async () => {
    render(
      <ModelSettingsApiKeys onProviderSelect={mockOnProviderSelect} selectedProviderId={null} />
    );
    await waitFor(() => {
      expect(screen.getByText('OpenRouter Production')).toBeInTheDocument();
      expect(screen.getByText('Gemini Development')).toBeInTheDocument();
      expect(screen.getByText('DeepSeek Testing')).toBeInTheDocument();
    });
  });

  it('should call onProviderSelect when API key card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ModelSettingsApiKeys onProviderSelect={mockOnProviderSelect} selectedProviderId={null} />
    );
    await waitFor(() => {
      expect(screen.getByTestId('api-key-card-1')).toBeInTheDocument();
    });
    const card = screen.getByTestId('api-key-card-1');
    await user.click(card);
    expect(mockOnProviderSelect).toHaveBeenCalledWith(mockApiProviderKeys[0]);
  });

  it('should mark selected card as selected after click', async () => {
    const user = userEvent.setup();
    render(
      <ModelSettingsApiKeys onProviderSelect={mockOnProviderSelect} selectedProviderId={null} />
    );
    await waitFor(() => {
      expect(screen.getByTestId('api-key-card-2')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('api-key-card-2'));
    await waitFor(() => {
      expect(screen.getByTestId('selected-2')).toHaveTextContent('selected');
      expect(screen.getByTestId('selected-3')).toHaveTextContent('not-selected');
    });
  });

  it('should show loading state initially', () => {
    mockList.mockImplementation(() => new Promise(() => {}));
    render(
      <ModelSettingsApiKeys onProviderSelect={mockOnProviderSelect} selectedProviderId={null} />
    );
    expect(screen.getByText('Loading API keys...')).toBeInTheDocument();
  });

  it('should show empty state when no API keys', async () => {
    mockList.mockResolvedValue([]);
    render(
      <ModelSettingsApiKeys onProviderSelect={mockOnProviderSelect} selectedProviderId={null} />
    );
    await waitFor(() => {
      expect(screen.getByText('No API keys yet. Click "Add Key" to create one.')).toBeInTheDocument();
    });
  });

  it('should refresh list when api-key-created event is dispatched', async () => {
    render(
      <ModelSettingsApiKeys onProviderSelect={mockOnProviderSelect} selectedProviderId={null} />
    );
    await waitFor(() => {
      expect(mockList).toHaveBeenCalledTimes(1);
    });
    window.dispatchEvent(new CustomEvent('api-key-created'));
    await waitFor(() => {
      expect(mockList).toHaveBeenCalledTimes(2);
    });
  });
});
