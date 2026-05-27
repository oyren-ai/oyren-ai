import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SnippetButton from '../SnippetButton';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Sparkles: () => <span>Sparkles</span>,
}));

describe('SnippetButton', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<SnippetButton isActive={false} onClick={mockOnClick} />);

      expect(screen.getByText('AI Snippet')).toBeInTheDocument();
    });

    it('renders with sparkles icon', () => {
      render(<SnippetButton isActive={false} onClick={mockOnClick} />);

      // Mock renders as span
      expect(screen.getByText('Sparkles')).toBeInTheDocument();
    });

    it('has correct title attribute', () => {
      render(<SnippetButton isActive={false} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'AI Snippet - Capture area to ask questions');
    });
  });

  describe('Click Behavior', () => {
    it('calls onClick when button is clicked', () => {
      render(<SnippetButton isActive={false} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when active button is clicked', () => {
      render(<SnippetButton isActive={true} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Active State Styling', () => {
    it('applies inactive styles when isActive is false', () => {
      render(<SnippetButton isActive={false} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-purple-400/60', 'bg-transparent');
      expect(button).not.toHaveClass('from-purple-500');
    });

    it('applies active styles when isActive is true', () => {
      render(<SnippetButton isActive={true} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-purple-500', 'to-blue-500', 'shadow-md');
    });

    it('shows gradient background when active', () => {
      render(<SnippetButton isActive={true} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r', 'from-purple-500', 'to-blue-500');
    });

    it('shows border when inactive', () => {
      render(<SnippetButton isActive={false} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-purple-400/60');
    });
  });

  describe('Visual States', () => {
    it('changes appearance when toggling from inactive to active', () => {
      const { rerender } = render(<SnippetButton isActive={false} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');

      rerender(<SnippetButton isActive={true} onClick={mockOnClick} />);
      expect(button).toHaveClass('from-purple-500');
    });

    it('changes appearance when toggling from active to inactive', () => {
      const { rerender } = render(<SnippetButton isActive={true} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('shadow-md');

      rerender(<SnippetButton isActive={false} onClick={mockOnClick} />);
      expect(button).not.toHaveClass('shadow-md');
    });
  });

  describe('Icon', () => {
    it('renders Sparkles icon', () => {
      render(<SnippetButton isActive={false} onClick={mockOnClick} />);

      // Check the icon is rendered (as mocked span)
      expect(screen.getByText('Sparkles')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      render(<SnippetButton isActive={false} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('can be focused', () => {
      render(<SnippetButton isActive={false} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});

