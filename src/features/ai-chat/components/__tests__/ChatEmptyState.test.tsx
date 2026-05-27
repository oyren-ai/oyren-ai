import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatEmptyState from '../ChatEmptyState';

describe('ChatEmptyState', () => {
  it('should render with API key available', () => {
    render(<ChatEmptyState hasApiKey={true} workspaceId="ws-1" />);

    expect(screen.getByText('OyrenAI')).toBeInTheDocument();
    expect(screen.getByText('AI Ready')).toBeInTheDocument();
    expect(screen.getByText('No conversation yet')).toBeInTheDocument();
    expect(screen.getByText('Your PDF AI Copilot')).toBeInTheDocument();
  });

  it('should render with API key not available', () => {
    render(<ChatEmptyState hasApiKey={false} />);

    expect(screen.getByText('OyrenAI')).toBeInTheDocument();
    expect(screen.getByText('AI Offline')).toBeInTheDocument();
  });

  it('should apply custom test id', () => {
    render(<ChatEmptyState hasApiKey={true} workspaceId="ws-1" data-testid="custom-empty-state" />);

    expect(screen.getByTestId('custom-empty-state')).toBeInTheDocument();
  });

  it('should show green indicator when API key is available', () => {
    const { container } = render(<ChatEmptyState hasApiKey={true} workspaceId="ws-1" />);
    
    const indicator = container.querySelector('.bg-green-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should show red indicator when API key is not available', () => {
    const { container } = render(<ChatEmptyState hasApiKey={false} />);
    
    const indicator = container.querySelector('.bg-red-500');
    expect(indicator).toBeInTheDocument();
  });
});

