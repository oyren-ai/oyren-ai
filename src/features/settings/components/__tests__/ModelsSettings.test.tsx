import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelsSettings } from '../ModelsSettings';

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

vi.mock('@/api/aiProviderModelApi', () => ({
  aiProviderModelApi: {
    updateActive: vi.fn(),
  },
}));

// Mock hardcodedAiModels
vi.mock('@/config/constants/supportedApiModelsPerProvider/hardcodedAiModels', () => ({
  AiProvider: {
    Gemini: 'gemini',
    DeepSeek: 'deepseek',
    OpenRouter: 'openrouter'
  },
  hardcodedAiModels: {
    deepseek: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', enabled: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'deepseek', enabled: false },
    ],
    openrouter: [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openrouter', enabled: false },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter', enabled: true },
    ],
    gemini: []
  }
}));

// Mock ApiKeyCard
vi.mock('../ApiKeyCard', () => ({
  ApiKeyCard: ({ apiKey, onClick }: any) => (
    <div data-testid={`api-key-card-${apiKey.id}`} onClick={onClick}>
      <span>{apiKey.name}</span>
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Cpu: () => <span data-testid="cpu-icon">Cpu</span>,
    Key: () => <span data-testid="key-icon">Key</span>,
    Plus: () => <span>Plus</span>,
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

describe('ModelsSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(mockApiProviderKeys);
  });

  it('should render AI Models card', () => {
    render(<ModelsSettings />);

    expect(screen.getByText('AI Models')).toBeInTheDocument();
    expect(screen.getByText('Select an API key to view available models')).toBeInTheDocument();
    expect(screen.getByTestId('cpu-icon')).toBeInTheDocument();
  });

  it('should show "Select an API key" message when no provider is selected', () => {
    render(<ModelsSettings />);

    // When no provider is selected, shows the default message
    expect(screen.getByText('Select an API key to view available models')).toBeInTheDocument();

    // No model names should be visible
    expect(screen.queryByText('DeepSeek Chat')).not.toBeInTheDocument();
    expect(screen.queryByText('GPT-4o')).not.toBeInTheDocument();
  });

  it('should not render any switches when no provider is selected', () => {
    render(<ModelsSettings />);

    // No switches should exist when no provider is selected
    const switches = screen.queryAllByRole('switch');
    expect(switches).toHaveLength(0);
  });

  it('should render API Keys card', () => {
    render(<ModelsSettings />);

    expect(screen.getByText('API Keys')).toBeInTheDocument();
    expect(screen.getByText('Configure your AI service provider API keys')).toBeInTheDocument();
    expect(screen.getByTestId('key-icon')).toBeInTheDocument();
  });

  it('should render API key cards', async () => {
    render(<ModelsSettings />);

    await waitFor(() => {
      expect(screen.getByText('OpenRouter Production')).toBeInTheDocument();
      expect(screen.getByText('Gemini Development')).toBeInTheDocument();
      expect(screen.getByText('DeepSeek Testing')).toBeInTheDocument();
    });
  });

  it('should update description when provider is selected', async () => {
    const user = userEvent.setup();
    render(<ModelsSettings />);

    // Initially shows default message
    expect(screen.getByText('Select an API key to view available models')).toBeInTheDocument();

    // Wait for API keys to load
    await waitFor(() => {
      expect(screen.getByTestId('api-key-card-3')).toBeInTheDocument();
    });

    // Click on DeepSeek API key card
    const deepseekCard = screen.getByTestId('api-key-card-3');
    await user.click(deepseekCard);

    // Description should update
    expect(screen.getByText('AI models for deepseek')).toBeInTheDocument();
  });

  it('should have correct grid layout', () => {
    const { container } = render(<ModelsSettings />);

    const grid = container.querySelector('.grid.gap-6.lg\\:grid-cols-2');
    expect(grid).toBeInTheDocument();
  });
});

