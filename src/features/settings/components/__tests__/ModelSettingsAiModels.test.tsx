import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelSettingsAiModels } from '../ModelSettingsAiModels';
import type { AiModel } from '@/types/aiProviderKey';

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Cpu: () => <span data-testid="cpu-icon">Cpu</span>,
  };
});

describe('ModelSettingsAiModels', () => {
  const deepseekModels: AiModel[] = [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', enabled: true },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'deepseek', enabled: false },
  ];

  const openrouterModels: AiModel[] = [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openrouter', enabled: false },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter', enabled: true },
  ];

  const allModels: AiModel[] = [...deepseekModels, ...openrouterModels];
  const mockOnModelToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render AI Models card', () => {
    render(<ModelSettingsAiModels onModelToggle={mockOnModelToggle} testingModels={{}} selectedProviderName={null} models={[]} />);

    expect(screen.getByText('AI Models')).toBeInTheDocument();
    expect(screen.getByText('Select an API key to view available models')).toBeInTheDocument();
    expect(screen.getByTestId('cpu-icon')).toBeInTheDocument();
  });

  it('should render all models when no provider is selected', () => {
    render(<ModelSettingsAiModels onModelToggle={mockOnModelToggle} testingModels={{}} selectedProviderName={null} models={allModels} />);

    expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek Reasoner')).toBeInTheDocument();
    expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument();
  });

  it('should filter models by provider when provider is selected', () => {
    render(<ModelSettingsAiModels onModelToggle={mockOnModelToggle} testingModels={{}} selectedProviderName="deepseek" models={deepseekModels} />);

    expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek Reasoner')).toBeInTheDocument();
    expect(screen.queryByText('GPT-4o')).not.toBeInTheDocument();
  });

  it('should show provider-specific description when provider is selected', () => {
    render(<ModelSettingsAiModels onModelToggle={mockOnModelToggle} testingModels={{}} selectedProviderName="deepseek" models={deepseekModels} />);

    expect(screen.getByText('AI models for deepseek')).toBeInTheDocument();
  });

  it('should filter openrouter models correctly', () => {
    render(<ModelSettingsAiModels onModelToggle={mockOnModelToggle} testingModels={{}} selectedProviderName="openrouter" models={openrouterModels} />);

    expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument();
    expect(screen.queryByText('DeepSeek Chat')).not.toBeInTheDocument();
  });

  it('should show enabled/disabled status for each model', () => {
    render(<ModelSettingsAiModels onModelToggle={mockOnModelToggle} testingModels={{}} selectedProviderName={null} models={allModels} />);

    const enabledStatuses = screen.getAllByText('Enabled');
    const disabledStatuses = screen.getAllByText('Disabled');
    expect(enabledStatuses).toHaveLength(2);
    expect(disabledStatuses).toHaveLength(2);
  });

  it('should call onModelToggle with model id and new state when switch is clicked', async () => {
    const user = userEvent.setup();
    render(<ModelSettingsAiModels onModelToggle={mockOnModelToggle} testingModels={{}} selectedProviderName="deepseek" models={deepseekModels} />);

    const switches = screen.getAllByRole('switch');
    await user.click(switches[0]);

    expect(mockOnModelToggle).toHaveBeenCalledWith('deepseek-chat', false);
  });
});
