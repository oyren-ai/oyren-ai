import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneralSettings } from '../GeneralSettings';

// Mock ModeToggle
vi.mock('@/components/common/ModeToggle', () => ({
  ModeToggle: ({ variant }: { variant?: string }) => (
    <div data-testid="mode-toggle" data-variant={variant}>Mode Toggle</div>
  )
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Palette: () => <span data-testid="palette-icon">Palette</span>,
    Bell: () => <span data-testid="bell-icon">Bell</span>,
    Languages: () => <span data-testid="languages-icon">Languages</span>,
    Download: () => <span data-testid="download-icon">Download</span>,
    Trash2: () => <span data-testid="trash-icon">Trash2</span>,
    Shield: () => <span data-testid="shield-icon">Shield</span>,
  };
});

describe('GeneralSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render appearance card', () => {
    render(<GeneralSettings />);
    
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Customize the look and feel of OyrenAI')).toBeInTheDocument();
    expect(screen.getByTestId('palette-icon')).toBeInTheDocument();
  });

  it('should render theme toggle', () => {
    render(<GeneralSettings />);
    
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Choose your preferred theme')).toBeInTheDocument();
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('mode-toggle')).toHaveAttribute('data-variant', 'settings');
  });

  it('should render language and region card', () => {
    render(<GeneralSettings />);
    
    expect(screen.getByText('Language & Region')).toBeInTheDocument();
    expect(screen.getByText('Set your language and regional preferences')).toBeInTheDocument();
    expect(screen.getByTestId('languages-icon')).toBeInTheDocument();
  });

  it('should render language selector with default value', () => {
    render(<GeneralSettings />);
    
    expect(screen.getByText('Display Language')).toBeInTheDocument();
    expect(screen.getByText('Choose your preferred language')).toBeInTheDocument();
    
    // Check for select trigger
    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toBeInTheDocument();
  });

  it.skip('should allow changing language', async () => {
    // Skipped due to Radix UI Select pointer capture features in jsdom
    const user = userEvent.setup();
    render(<GeneralSettings />);
    
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    
    // Wait for select content to appear
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Español')).toBeInTheDocument();
      expect(screen.getByText('Français')).toBeInTheDocument();
      expect(screen.getByText('Deutsch')).toBeInTheDocument();
    });
  });

  it('should render notifications card', () => {
    render(<GeneralSettings />);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Manage your notification preferences')).toBeInTheDocument();
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });

  it('should render notification switch', () => {
    render(<GeneralSettings />);
    
    expect(screen.getByText('Desktop Notifications')).toBeInTheDocument();
    expect(screen.getByText('Receive notifications for important updates')).toBeInTheDocument();
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toBeChecked(); // Default is true
  });

  it('should toggle notification switch', async () => {
    const user = userEvent.setup();
    render(<GeneralSettings />);
    
    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);
    
    expect(switchElement).not.toBeChecked();
  });

  it('should render data management card', () => {
    render(<GeneralSettings />);
    
    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your data and settings')).toBeInTheDocument();
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
  });

  it('should render export data button', () => {
    render(<GeneralSettings />);
    
    expect(screen.getByText('Data Export')).toBeInTheDocument();
    expect(screen.getByText('Export your data and settings')).toBeInTheDocument();
    
    const exportButton = screen.getByRole('button', { name: /export data/i });
    expect(exportButton).toBeInTheDocument();
    expect(screen.getByTestId('download-icon')).toBeInTheDocument();
  });

  it('should render clear data section', () => {
    render(<GeneralSettings />);
    
    // "Clear Data" başlığını yoxla (bu <p> tag-indədir)
    expect(screen.getByText('Clear Data', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Remove all local data and reset app')).toBeInTheDocument();
    
    // Button-u yoxla
    const clearButton = screen.getByRole('button', { name: /clear data/i });
    expect(clearButton).toBeInTheDocument();
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });

  it('should have correct grid layout', () => {
    const { container } = render(<GeneralSettings />);
    
    const grid = container.querySelector('.grid.gap-6.lg\\:grid-cols-2');
    expect(grid).toBeInTheDocument();
  });
});