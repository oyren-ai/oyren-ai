import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MiniUserButton } from '../MiniUserButton';

vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useCredits', () => ({
  useCredits: () => ({ balance: { credits: 100 }, isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return { ...actual };
});

import { useAuth } from '@/contexts/AuthContext';

const mockLogin = vi.fn();
const mockLogout = vi.fn();

const authenticatedState = {
  user: { userId: '1', email: 'test@example.com', name: 'Test User' },
  isAuthenticated: true,
  isLoading: false,
  login: mockLogin,
  logout: mockLogout,
};

const unauthenticatedState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  logout: mockLogout,
};

describe('MiniUserButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls login when clicked while unauthenticated', () => {
    vi.mocked(useAuth).mockReturnValue(unauthenticatedState);
    render(<MiniUserButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('opens profile dialog when clicked while authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue(authenticatedState);
    render(<MiniUserButton />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  it('shows user name and email in profile dialog', async () => {
    vi.mocked(useAuth).mockReturnValue(authenticatedState);
    render(<MiniUserButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('calls logout and closes dialog on logout click', async () => {
    vi.mocked(useAuth).mockReturnValue(authenticatedState);
    render(<MiniUserButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Log out')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Log out'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('disables button during loading', () => {
    vi.mocked(useAuth).mockReturnValue({ ...unauthenticatedState, isLoading: true });
    render(<MiniUserButton />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('has muted style when logged out', () => {
    vi.mocked(useAuth).mockReturnValue(unauthenticatedState);
    render(<MiniUserButton />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-8', 'w-8', 'text-muted-foreground');
  });

  it('has green accent when logged in', () => {
    vi.mocked(useAuth).mockReturnValue(authenticatedState);
    render(<MiniUserButton />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-8', 'w-8', 'text-green-500');
  });
});
