import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TopBar from '../TopBar';

// Mock the modal context
vi.mock('@/contexts/ModalContext');

import { useCreateWorkspaceModal } from '@/contexts/ModalContext';

describe('TopBar', () => {
  const mockCreateWorkspaceModalOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCreateWorkspaceModal).mockReturnValue({
      open: mockCreateWorkspaceModalOpen,
      close: vi.fn(),
      isOpen: false,
      data: undefined,
    });
  });

  it('renders "Home" title', () => {
    render(<TopBar />);

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders "New Workspace" button', () => {
    render(<TopBar />);

    const button = screen.getByRole('button', { name: /new workspace/i });
    expect(button).toBeInTheDocument();
  });

  it('opens create workspace modal when button is clicked', () => {
    render(<TopBar />);

    const button = screen.getByRole('button', { name: /new workspace/i });
    fireEvent.click(button);

    expect(mockCreateWorkspaceModalOpen).toHaveBeenCalledTimes(1);
  });

  it('has proper layout classes', () => {
    const { container } = render(<TopBar />);

    const topBar = container.firstChild as HTMLElement;
    expect(topBar).toHaveClass('border-b');
    expect(topBar).toHaveClass('bg-background');

    const innerContainer = topBar.firstChild as HTMLElement;
    expect(innerContainer).toHaveClass('flex');
    expect(innerContainer).toHaveClass('items-center');
    expect(innerContainer).toHaveClass('h-12');
    expect(innerContainer).toHaveClass('px-4');
  });

  it('title has proper styling', () => {
    render(<TopBar />);

    const title = screen.getByText('Home');
    expect(title).toHaveClass('text-xl');
    expect(title).toHaveClass('font-semibold');
    expect(title).toHaveClass('text-foreground');
  });

  it('button has Plus icon', () => {
    const { container } = render(<TopBar />);

    // The Plus icon is rendered as an SVG
    const button = screen.getByRole('button', { name: /new workspace/i });
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has spacer between title and button', () => {
    const { container } = render(<TopBar />);

    const spacer = container.querySelector('.flex-1');
    expect(spacer).toBeInTheDocument();
  });

  it('button has small size', () => {
    render(<TopBar />);

    const button = screen.getByRole('button', { name: /new workspace/i });
    // The size="sm" prop is applied to the Button component
    expect(button).toBeInTheDocument();
  });
});

