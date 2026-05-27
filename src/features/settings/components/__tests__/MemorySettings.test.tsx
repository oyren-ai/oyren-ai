import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemorySettings } from '../MemorySettings';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Database: () => <span data-testid="database-icon">Database</span>,
  };
});

describe('MemorySettings', () => {
  it('should render memory and indexing card', () => {
    render(<MemorySettings />);
    
    expect(screen.getByText('Memory & Indexing')).toBeInTheDocument();
    expect(screen.getByText('Document indexing and memory management')).toBeInTheDocument();
    // Database icon appears twice (header and coming soon section), so use getAllByTestId
    const icons = screen.getAllByTestId('database-icon');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render coming soon message', () => {
    render(<MemorySettings />);
    
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('Memory and indexing features are currently in development.')).toBeInTheDocument();
  });

  it('should render database icon in coming soon section', () => {
    render(<MemorySettings />);
    
    const icons = screen.getAllByTestId('database-icon');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should have centered content layout', () => {
    const { container } = render(<MemorySettings />);
    
    const content = container.querySelector('.py-12.text-center');
    expect(content).toBeInTheDocument();
  });
});

