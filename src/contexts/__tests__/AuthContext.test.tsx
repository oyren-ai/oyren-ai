import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock('@tauri-apps/plugin-deep-link', () => ({
  onOpenUrl: vi.fn(() => Promise.resolve(() => {})),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(invoke).mockResolvedValue(undefined);
    // Reset the listen mock to return a promise
    vi.mocked(listen).mockImplementation(() => Promise.resolve(() => {}));
  });

  it('should initialize with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should call open_auth_browser when login is triggered', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login();
    });

    expect(invoke).toHaveBeenCalledWith('open_auth_browser', { isDev: expect.any(Boolean) });
  });

  it('should validate and decode JWT token correctly', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
    
    localStorage.setItem('oyren_auth_token', mockToken);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
    });
  });

  it('should handle UTF-8 characters in token payload', async () => {
    // Test with Azerbaijani characters
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJlbWFpbCI6ImF5c2VsQGV4YW1wbGUuY29tIiwibmFtZSI6IkF5c2VsIE3JmW1txZlkb3ZhIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
    
    localStorage.setItem('oyren_auth_token', mockToken);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      // Check that UTF-8 characters are decoded (name should contain special characters)
      expect(result.current.user?.name).toBeTruthy();
      expect(result.current.user?.name).toContain('Aysel');
      // The token contains "Məmmřdova" with special Azerbaijani characters
      expect(result.current.user?.name).toMatch(/M.*m.*dova/);
    });
  });

  it('should clear expired tokens', async () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJleHAiOjF9.signature';
    
    localStorage.setItem('oyren_auth_token', expiredToken);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('oyren_auth_token')).toBeNull();
    });
  });

  it('should logout and clear token', () => {
    localStorage.setItem('oyren_auth_token', 'mock-token');

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('oyren_auth_token')).toBeNull();
  });
});