import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { ViewNavigationProvider, useViewNavigation } from '../NavigationContext';
import { AppProvider } from '../AppContext';

// Test wrapper with AppProvider (since ViewNavigationProvider depends on it)
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>
    {children}
  </AppProvider>
);

describe('NavigationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when used outside provider', () => {
    const { result } = renderHook(() => {
      try {
        return useViewNavigation();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toBe('useNavigation must be used within NavigationProvider');
  });

  it('should provide default values', () => {
    const { result } = renderHook(() => useViewNavigation(), {
      wrapper: ({ children }) => (
        <TestWrapper>
          <ViewNavigationProvider>
            {children}
          </ViewNavigationProvider>
        </TestWrapper>
      ),
    });

    expect(result.current.currentView).toBe('home-page');
    expect(result.current.selectedWorkspace).toBe(null);
  });

  it('should navigate to workspace view with workspace data', () => {
    const { result } = renderHook(() => useViewNavigation(), {
      wrapper: ({ children }) => (
        <TestWrapper>
          <ViewNavigationProvider>
            {children}
          </ViewNavigationProvider>
        </TestWrapper>
      ),
    });

    const mockWorkspace = {
      id: 'workspace-123',
      name: 'Test Workspace',
      description: 'Test Description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
    };

    act(() => {
      result.current.navigateToWorkspace(mockWorkspace);
    });

    expect(result.current.currentView).toBe('workspace');
    expect(result.current.selectedWorkspace).toEqual(mockWorkspace);
    expect(result.current.selectedWorkspace?.id).toBe('workspace-123');
  });

  it('should navigate to settings view', () => {
    const { result } = renderHook(() => useViewNavigation(), {
      wrapper: ({ children }) => (
        <TestWrapper>
          <ViewNavigationProvider>
            {children}
          </ViewNavigationProvider>
        </TestWrapper>
      ),
    });

    act(() => {
      result.current.navigateToSettings();
    });

    expect(result.current.currentView).toBe('settings');
    expect(result.current.selectedWorkspace).toBe(null);
    expect(result.current.settingsTab).toBe(null);
  });

  it('should navigate to settings view with a specific tab', () => {
    const { result } = renderHook(() => useViewNavigation(), {
      wrapper: ({ children }) => (
        <TestWrapper>
          <ViewNavigationProvider>
            {children}
          </ViewNavigationProvider>
        </TestWrapper>
      ),
    });

    act(() => {
      result.current.navigateToSettings('models');
    });

    expect(result.current.currentView).toBe('settings');
    expect(result.current.settingsTab).toBe('models');

    act(() => {
      result.current.clearSettingsTab();
    });

    expect(result.current.settingsTab).toBe(null);
  });

  it('should navigate back to home', () => {
    const { result } = renderHook(() => useViewNavigation(), {
      wrapper: ({ children }) => (
        <TestWrapper>
          <ViewNavigationProvider>
            {children}
          </ViewNavigationProvider>
        </TestWrapper>
      ),
    });

    // First navigate to workspace
    const mockWorkspace = {
      id: 'workspace-123',
      name: 'Test Workspace',
      description: 'Test Description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
    };

    act(() => {
      result.current.navigateToWorkspace(mockWorkspace);
    });

    expect(result.current.currentView).toBe('workspace');

    // Then navigate back to home
    act(() => {
      result.current.navigateToHome();
    });

    expect(result.current.currentView).toBe('home-page');
    expect(result.current.selectedWorkspace).toBe(null);
  });

  it('should navigate back to home when settings entered from home', () => {
    const { result } = renderHook(() => useViewNavigation(), {
      wrapper: ({ children }) => (
        <TestWrapper>
          <ViewNavigationProvider>
            {children}
          </ViewNavigationProvider>
        </TestWrapper>
      ),
    });

    act(() => {
      result.current.navigateToSettings();
    });

    expect(result.current.currentView).toBe('settings');

    act(() => {
      result.current.navigateBack();
    });

    expect(result.current.currentView).toBe('home-page');
    expect(result.current.selectedWorkspace).toBe(null);
  });

  it('should navigate back to workspace when settings entered from workspace', () => {
    const { result } = renderHook(() => useViewNavigation(), {
      wrapper: ({ children }) => (
        <TestWrapper>
          <ViewNavigationProvider>
            {children}
          </ViewNavigationProvider>
        </TestWrapper>
      ),
    });

    const mockWorkspace = {
      id: 'workspace-456',
      name: 'Active Workspace',
      description: 'Working on something',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
    };

    act(() => {
      result.current.navigateToWorkspace(mockWorkspace);
    });

    expect(result.current.currentView).toBe('workspace');

    act(() => {
      result.current.navigateToSettings('models');
    });

    expect(result.current.currentView).toBe('settings');
    expect(result.current.selectedWorkspace).toBe(null);

    act(() => {
      result.current.navigateBack();
    });

    expect(result.current.currentView).toBe('workspace');
    expect(result.current.selectedWorkspace).toEqual(mockWorkspace);
  });
});