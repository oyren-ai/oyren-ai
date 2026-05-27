import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LeftMiniBar from '../LeftMiniBar';

// Mock the dependencies
vi.mock('@/contexts/NavigationContext');
vi.mock('@/components/common/ModeToggle', () => ({
  ModeToggle: ({ variant }: { variant: string }) => (
    <button data-testid="mode-toggle" data-variant={variant}>
      Toggle Theme
    </button>
  ),
}));
vi.mock('@/components/icons/Logo', () => ({
  default: ({ className, size }: { className: string; size: number }) => (
    <div data-testid="logo" data-classname={className} data-size={size}>
      Logo
    </div>
  ),
}));
vi.mock('../MiniUserButton', () => ({
  MiniUserButton: () => <button data-testid="mini-user-button">User</button>,
}));

import { useViewNavigation } from '@/contexts/NavigationContext';

describe('LeftMiniBar', () => {
  const mockNavigateToSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useViewNavigation).mockReturnValue({
      currentView: 'home-page',
      selectedWorkspace: null,
      navigateToWorkspace: vi.fn(),
      navigateToHome: vi.fn(),
      navigateBack: vi.fn(),
      navigateToSettings: mockNavigateToSettings,
      settingsTab: null,
      clearSettingsTab: vi.fn(),
    });
  });

  it('renders the logo', () => {
    render(<LeftMiniBar />);

    const logo = screen.getByTestId('logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('data-classname', 'text-primary');
    expect(logo).toHaveAttribute('data-size', '24');
  });

  it('renders mode toggle with simple variant', () => {
    render(<LeftMiniBar />);

    const modeToggle = screen.getByTestId('mode-toggle');
    expect(modeToggle).toBeInTheDocument();
    expect(modeToggle).toHaveAttribute('data-variant', 'simple');
  });

  it('renders settings button', () => {
    const { container } = render(<LeftMiniBar />);

    // Settings button contains SVG icon
    const settingsButton = container.querySelector('button svg[data-testid="icon-settings"]')?.parentElement;
    expect(settingsButton).toBeInTheDocument();
  });

  it('navigates to settings when settings button is clicked', () => {
    const { container } = render(<LeftMiniBar />);

    // Settings button contains SVG icon
    const settingsButton = container.querySelector('button svg[data-testid="icon-settings"]')?.parentElement;
    fireEvent.click(settingsButton!);

    expect(mockNavigateToSettings).toHaveBeenCalledTimes(1);
  });

  it('has correct layout classes', () => {
    const { container } = render(<LeftMiniBar />);

    const sidebar = container.firstChild as HTMLElement;
    expect(sidebar).toHaveClass('w-12');
    expect(sidebar).toHaveClass('border-r');
    expect(sidebar).toHaveClass('border-border');
    expect(sidebar).toHaveClass('flex');
    expect(sidebar).toHaveClass('flex-col');
    expect(sidebar).toHaveClass('items-center');
    expect(sidebar).toHaveClass('py-4');
  });

  it('positions controls at the bottom', () => {
    const { container } = render(<LeftMiniBar />);

    const controlsContainer = container.querySelector('.mt-auto');
    expect(controlsContainer).toBeInTheDocument();
    expect(controlsContainer).toHaveClass('flex');
    expect(controlsContainer).toHaveClass('flex-col');
    expect(controlsContainer).toHaveClass('gap-2');
  });

  it('renders MiniUserButton', () => {
    render(<LeftMiniBar />);
    expect(screen.getByTestId('mini-user-button')).toBeInTheDocument();
  });

  it('settings button has proper styling', () => {
    const { container } = render(<LeftMiniBar />);

    // Settings button contains SVG icon
    const settingsButton = container.querySelector('button svg[data-testid="icon-settings"]')?.parentElement;
    expect(settingsButton).toHaveClass('h-8');
    expect(settingsButton).toHaveClass('w-8');
    expect(settingsButton).toHaveClass('rounded-lg');
  });
});

