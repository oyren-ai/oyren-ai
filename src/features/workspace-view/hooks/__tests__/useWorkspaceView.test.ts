import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkspaceView } from '../useWorkspaceView';

describe('useWorkspaceView', () => {
  it('returns sidebar collapsed state from context', () => {
    const mockSetSidebarCollapsed = vi.fn();

    const { result } = renderHook(() =>
      useWorkspaceView(false, mockSetSidebarCollapsed)
    );

    expect(result.current.isSidebarCollapsed).toBe(false);
  });

  it('toggles sidebar collapsed state', () => {
    const mockSetSidebarCollapsed = vi.fn();

    const { result } = renderHook(() =>
      useWorkspaceView(false, mockSetSidebarCollapsed)
    );

    act(() => {
      result.current.handleToggleSidebar();
    });

    expect(mockSetSidebarCollapsed).toHaveBeenCalledWith(true);
  });

  it('toggles sidebar from collapsed to expanded', () => {
    const mockSetSidebarCollapsed = vi.fn();

    const { result } = renderHook(() =>
      useWorkspaceView(true, mockSetSidebarCollapsed)
    );

    act(() => {
      result.current.handleToggleSidebar();
    });

    expect(mockSetSidebarCollapsed).toHaveBeenCalledWith(false);
  });
});