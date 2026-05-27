import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsTabs } from '../SettingsTabs';

// Mock child components
vi.mock('../GeneralSettings', () => ({
  GeneralSettings: () => <div data-testid="general-settings">General Settings</div>
}));

vi.mock('../ModelsSettings', () => ({
  ModelsSettings: () => <div data-testid="models-settings">Models Settings</div>
}));

vi.mock('../MemorySettings', () => ({
  MemorySettings: () => <div data-testid="memory-settings">Memory Settings</div>
}));

vi.mock('../DocsSettings', () => ({
  DocsSettings: () => <div data-testid="docs-settings">Docs Settings</div>
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Settings: () => <span data-testid="settings-icon">Settings</span>,
    Cpu: () => <span data-testid="cpu-icon">Cpu</span>,
    Database: () => <span data-testid="database-icon">Database</span>,
    BookOpen: () => <span data-testid="book-icon">BookOpen</span>,
  };
});

describe('SettingsTabs', () => {
  const mockOnCategoryChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all tab triggers', () => {
    render(<SettingsTabs activeCategory="general" onCategoryChange={mockOnCategoryChange} />);
    
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
  });

  it('should render icons for each tab', () => {
    render(<SettingsTabs activeCategory="general" onCategoryChange={mockOnCategoryChange} />);
    
    expect(screen.getAllByTestId('settings-icon').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('cpu-icon').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('database-icon').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('book-icon').length).toBeGreaterThan(0);
  });

  it('should show general settings content when general tab is active', () => {
    render(<SettingsTabs activeCategory="general" onCategoryChange={mockOnCategoryChange} />);
    
    expect(screen.getByTestId('general-settings')).toBeInTheDocument();
  });

  it('should show models settings content when models tab is active', () => {
    render(<SettingsTabs activeCategory="models" onCategoryChange={mockOnCategoryChange} />);
    
    expect(screen.getByTestId('models-settings')).toBeInTheDocument();
  });

  it('should show memory settings content when memory tab is active', () => {
    render(<SettingsTabs activeCategory="memory" onCategoryChange={mockOnCategoryChange} />);
    
    expect(screen.getByTestId('memory-settings')).toBeInTheDocument();
  });

  it('should show docs settings content when docs tab is active', () => {
    render(<SettingsTabs activeCategory="docs" onCategoryChange={mockOnCategoryChange} />);
    
    expect(screen.getByTestId('docs-settings')).toBeInTheDocument();
  });

  it.skip('should call onCategoryChange when tab is clicked', async () => {
    // Skipped due to Radix UI Tabs pointer capture features in jsdom
    // The onValueChange callback is handled internally by Radix UI
    const user = userEvent.setup();
    render(<SettingsTabs activeCategory="general" onCategoryChange={mockOnCategoryChange} />);
    
    const modelsTab = screen.getByText('Models');
    await user.click(modelsTab);
    
    expect(mockOnCategoryChange).toHaveBeenCalledWith('models');
  });

  it('should have correct tab list structure', () => {
    const { container } = render(<SettingsTabs activeCategory="general" onCategoryChange={mockOnCategoryChange} />);
    
    const tabsList = container.querySelector('.grid.w-full.max-w-md.grid-cols-4');
    expect(tabsList).toBeInTheDocument();
  });
});

