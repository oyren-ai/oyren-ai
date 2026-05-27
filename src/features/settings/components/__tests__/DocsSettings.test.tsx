import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DocsSettings } from '../DocsSettings';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    BookOpen: (props: any) => <span data-testid="book-icon" {...props}>BookOpen</span>,
    ExternalLink: (props: any) => <span data-testid="external-link-icon" {...props}>ExternalLink</span>,
  };
});

describe('DocsSettings', () => {
  const originalOpen = window.open;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.open properly
    window.open = vi.fn(() => null) as any;
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  it('should render documentation card', async () => {
    render(<DocsSettings />);
    
    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Documentation' })).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Access OyrenAI documentation and guides/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('book-icon').length).toBeGreaterThan(0);
  });

  it('should render documentation description', async () => {
    render(<DocsSettings />);
    
    await waitFor(() => {
      const description = screen.getByText(/Access comprehensive guides, tutorials, and API documentation/i);
      expect(description).toBeInTheDocument();
    });
  });

  it('should render open documentation button', async () => {
    render(<DocsSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('Open Documentation')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
  });

  it('should open documentation URL when button is clicked', async () => {
    const user = userEvent.setup();
    render(<DocsSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('Open Documentation')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /open documentation/i });
    await user.click(button);
    
    expect(window.open).toHaveBeenCalledWith('https://oyren.ai/docs', '_blank');
  });

  it('should have centered content layout', () => {
    const { container } = render(<DocsSettings />);
    
    // Look for the centered content container
    const centerContent = container.querySelector('[class*="text-center"]');
    expect(centerContent).toBeInTheDocument();
  });

  it('should render card component', async () => {
    const { container } = render(<DocsSettings />);
    
    await waitFor(() => {
      // Check if Card component is rendered (usually has specific classes)
      const card = container.querySelector('[class*="card"]') || 
                   container.querySelector('[class*="rounded"]');
      expect(card).toBeTruthy();
    });
  });

  it('should render all expected UI elements', async () => {
    render(<DocsSettings />);
    
    // Wait for all elements to be present
    await waitFor(() => {
      // Remove ambiguous getByText('Documentation')
      expect(screen.getAllByTestId('book-icon').length).toBeGreaterThan(0);
      expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /open documentation/i })).toBeInTheDocument();
    });
  });

  it('should have accessible button', async () => {
    render(<DocsSettings />);
    
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /open documentation/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('should handle button click without errors', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<DocsSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('Open Documentation')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /open documentation/i });
    await user.click(button);
    
    // Should not produce any console errors
    expect(consoleSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should open link in new tab', async () => {
    const user = userEvent.setup();
    render(<DocsSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('Open Documentation')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /open documentation/i });
    await user.click(button);
    
    // Verify window.open was called with _blank for new tab
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('oyren.ai'),
      '_blank'
    );
  });
});