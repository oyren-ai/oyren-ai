import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsFooter } from '../SettingsFooter';

describe('SettingsFooter', () => {
  it('should render version information', () => {
    render(<SettingsFooter />);
    
    expect(screen.getByText('OyrenAI v0.1.0')).toBeInTheDocument();
  });

  it('should render made with message', () => {
    render(<SettingsFooter />);
    
    expect(screen.getByText(/Made with 💖 for better document understanding/)).toBeInTheDocument();
  });

  it('should have correct structure with centered layout', () => {
    const { container } = render(<SettingsFooter />);
    
    const footer = container.firstChild as HTMLElement;
    expect(footer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
  });

  it('should have proper text styling', () => {
    const { container } = render(<SettingsFooter />);
    
    const versionText = screen.getByText('OyrenAI v0.1.0');
    expect(versionText).toHaveClass('text-sm', 'font-medium');
    
    const madeWithText = screen.getByText(/Made with 💖/);
    expect(madeWithText).toHaveClass('text-xs', 'text-muted-foreground');
  });
});

