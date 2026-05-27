import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorkspaces } from '@/features/workspace-management/hooks/useWorkspaces';
import { workspaceApi } from '@/api/workspaceApi.ts';
import type { Workspace } from '@/types/workspace';

// Mock the workspace API
vi.mock('@/api/workspaceApi', () => ({
  workspaceApi: {
    list: vi.fn(),
    list_for_display: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useWorkspaces', () => {
  const mockWorkspaces: Workspace[] = [
    {
      id: '1',
      name: 'Workspace 1',
      description: 'Description 1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_accessed_at: '2024-01-01T00:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
    },
    {
      id: '2',
      name: 'Workspace 2',
      description: 'Description 2',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_accessed_at: '2024-01-01T00:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load workspaces on mount', async () => {
    (workspaceApi.list_for_display as any).mockResolvedValueOnce(mockWorkspaces);

    const { result } = renderHook(() => useWorkspaces());

    // Wait for the initial loading to complete
    await waitFor(() => {
      expect(result.current.isLoadingWorkspaces).toBe(false);
    });

    expect(result.current.workspaces).toEqual(mockWorkspaces);
    expect(workspaceApi.list_for_display).toHaveBeenCalledTimes(1);
  });

  it('should handle loading error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (workspaceApi.list_for_display as any).mockRejectedValueOnce(new Error('Failed to load'));

    const { result } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoadingWorkspaces).toBe(false);
    });

    expect(result.current.workspaces).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load workspaces:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should reload workspaces when loadWorkspaces is called', async () => {
    (workspaceApi.list_for_display as any).mockResolvedValue(mockWorkspaces);

    const { result } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoadingWorkspaces).toBe(false);
    });

    expect(workspaceApi.list_for_display).toHaveBeenCalledTimes(1);

    // Call loadWorkspaces again
    await act(async () => {
      await result.current.loadWorkspaces();
    });

    expect(workspaceApi.list_for_display).toHaveBeenCalledTimes(2);
    expect(result.current.workspaces).toEqual(mockWorkspaces);
  });

  it('should delete workspace and reload list', async () => {
    (workspaceApi.list_for_display as any).mockResolvedValue(mockWorkspaces);
    (workspaceApi.delete as any).mockResolvedValueOnce(undefined);
    global.confirm = vi.fn(() => true);

    const { result } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoadingWorkspaces).toBe(false);
    });

    await act(async () => {
      await result.current.deleteWorkspace(mockWorkspaces[0]);
    });

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Workspace 1"?');
    expect(workspaceApi.delete).toHaveBeenCalledWith('1');
    expect(workspaceApi.list_for_display).toHaveBeenCalledTimes(2); // Initial load + reload after delete
  });

  it('should not delete workspace if user cancels confirmation', async () => {
    (workspaceApi.list_for_display as any).mockResolvedValue(mockWorkspaces);
    global.confirm = vi.fn(() => false);

    const { result } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoadingWorkspaces).toBe(false);
    });

    await act(async () => {
      await result.current.deleteWorkspace(mockWorkspaces[0]);
    });

    expect(global.confirm).toHaveBeenCalled();
    expect(workspaceApi.delete).not.toHaveBeenCalled();
    expect(workspaceApi.list_for_display).toHaveBeenCalledTimes(1); // Only initial load
  });

  it('should handle workspace-created event', async () => {
    (workspaceApi.list_for_display as any).mockResolvedValue(mockWorkspaces);

    const { result } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoadingWorkspaces).toBe(false);
    });

    expect(workspaceApi.list_for_display).toHaveBeenCalledTimes(1);

    // Dispatch workspace-created event
    act(() => {
      window.dispatchEvent(new CustomEvent('workspace-created'));
    });

    await waitFor(() => {
      expect(workspaceApi.list_for_display).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle workspace-updated event', async () => {
    (workspaceApi.list_for_display as any).mockResolvedValue(mockWorkspaces);

    const { result } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoadingWorkspaces).toBe(false);
    });

    const updatedWorkspace: Workspace = {
      id: '1',
      name: 'Updated Workspace 1',
      description: 'Updated Description',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      last_accessed_at: '2024-01-02T00:00:00Z',
      is_pinned: false,
      is_archived: false,
      is_favourite: false,
      is_active: true,
    };

    // Dispatch workspace-updated event
    act(() => {
      window.dispatchEvent(new CustomEvent('workspace-updated', {
        detail: updatedWorkspace
      }));
    });

    expect(result.current.workspaces).toEqual([
      updatedWorkspace,
      mockWorkspaces[1],
    ]);
  });

  it('should handle workspace-deleted event', async () => {
    (workspaceApi.list_for_display as any).mockResolvedValue(mockWorkspaces);

    const { result } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoadingWorkspaces).toBe(false);
    });

    expect(workspaceApi.list_for_display).toHaveBeenCalledTimes(1);

    // Dispatch workspace-deleted event
    act(() => {
      window.dispatchEvent(new CustomEvent('workspace-deleted'));
    });

    await waitFor(() => {
      expect(workspaceApi.list_for_display).toHaveBeenCalledTimes(2);
    });
  });

  it('should clean up event listeners on unmount', async () => {
    (workspaceApi.list_for_display as any).mockResolvedValue(mockWorkspaces);
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { result, unmount } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoadingWorkspaces).toBe(false);
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('workspace-created', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('workspace-updated', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('workspace-deleted', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should handle delete error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (workspaceApi.list_for_display as any).mockResolvedValue(mockWorkspaces);
    (workspaceApi.delete as any).mockRejectedValueOnce(new Error('Delete failed'));
    global.confirm = vi.fn(() => true);

    const { result } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoadingWorkspaces).toBe(false);
    });

    await act(async () => {
      await result.current.deleteWorkspace(mockWorkspaces[0]);
    });

    expect(workspaceApi.delete).toHaveBeenCalledWith('1');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete workspace:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });
});