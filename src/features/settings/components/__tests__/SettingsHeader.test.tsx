import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsHeader } from '../SettingsHeader';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    ArrowLeft: () => <span data-testid="arrow-left-icon">ArrowLeft</span>,
  };
});

describe('SettingsHeader', () => {
  const mockOnBackClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render settings title', () => {
    render(<SettingsHeader onBackClick={mockOnBackClick} />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render back button', () => {
    render(<SettingsHeader onBackClick={mockOnBackClick} />);
    
    const backButton = screen.getByRole('button');
    expect(backButton).toBeInTheDocument();
    expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
  });

  it('should call onBackClick when back button is clicked', () => {
    render(<SettingsHeader onBackClick={mockOnBackClick} />);
    
    const backButton = screen.getByRole('button');
    fireEvent.click(backButton);
    
    expect(mockOnBackClick).toHaveBeenCalledTimes(1);
  });

  it('should have correct header structure', () => {
    const { container } = render(<SettingsHeader onBackClick={mockOnBackClick} />);
    
    const header = container.querySelector('.border-b.bg-background');
    expect(header).toBeInTheDocument();
  });

  it('should have proper title styling', () => {
    render(<SettingsHeader onBackClick={mockOnBackClick} />);
    
    const title = screen.getByText('Settings');
    expect(title).toHaveClass('text-xl', 'font-semibold');
  });
});

