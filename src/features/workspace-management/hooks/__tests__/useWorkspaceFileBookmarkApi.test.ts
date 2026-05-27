import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWorkspaceFileBookmarkApi } from '../useWorkspaceFileBookmarkApi';
import type { WorkspaceFileBookmark } from '@/api/WorkspaceFileBookmarkApi';

// Mock the API
vi.mock('@/api/WorkspaceFileBookmarkApi', () => ({
  workspaceFileBookmarkApi: {
    listByFile: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useWorkspaceFileBookmarkApi', () => {
  const mockBookmark: WorkspaceFileBookmark = {
    id: 'bookmark-1',
    workspace_id: 'workspace-123',
    workspace_file_id: 'file-456',
    bookmark_page: 5,
    bookmark_description: 'Important section',
    date_created: '2024-01-01T00:00:00Z',
    metadata: '{"highlight": true}',
  };

  const mockBookmark2: WorkspaceFileBookmark = {
    ...mockBookmark,
    id: 'bookmark-2',
    bookmark_page: 10,
    bookmark_description: 'Key findings',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    vi.restoreAllMocks();
  });

  it('initializes with empty bookmarks and not loading', () => {
    const { result } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', '')
    );

    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('loads bookmarks on mount when workspaceFileId is provided', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');
    vi.mocked(workspaceFileBookmarkApi.listByFile).mockResolvedValue([mockBookmark]);

    const { result } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', 'file-456')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(workspaceFileBookmarkApi.listByFile).toHaveBeenCalledWith('file-456');
    expect(result.current.bookmarks).toEqual([mockBookmark]);
  });

  it('does not load bookmarks when workspaceFileId is empty', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');

    renderHook(() => useWorkspaceFileBookmarkApi('workspace-123', ''));

    expect(workspaceFileBookmarkApi.listByFile).not.toHaveBeenCalled();
  });

  it('sets loading state during fetch', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');

    let resolveBookmarks: (value: WorkspaceFileBookmark[]) => void;
    const bookmarksPromise = new Promise<WorkspaceFileBookmark[]>((resolve) => {
      resolveBookmarks = resolve;
    });

    vi.mocked(workspaceFileBookmarkApi.listByFile).mockReturnValue(bookmarksPromise);

    const { result } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', 'file-456')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    resolveBookmarks!([mockBookmark]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bookmarks).toEqual([mockBookmark]);
  });

  it('handles load errors gracefully', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(workspaceFileBookmarkApi.listByFile).mockRejectedValue(
      new Error('Failed to load bookmarks')
    );

    const { result } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', 'file-456')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bookmarks).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to load bookmarks:',
      expect.any(Error)
    );

    consoleError.mockRestore();
  });

  it('creates a bookmark and reloads', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');
    vi.mocked(workspaceFileBookmarkApi.listByFile)
      .mockResolvedValueOnce([mockBookmark])
      .mockResolvedValueOnce([mockBookmark, mockBookmark2]);
    vi.mocked(workspaceFileBookmarkApi.create).mockResolvedValue(mockBookmark2);

    const { result } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', 'file-456')
    );

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark]);
    });

    await act(async () => {
      await result.current.createBookmark(10, 'Key findings', '{"note": "test"}');
    });

    expect(workspaceFileBookmarkApi.create).toHaveBeenCalledWith(
      'workspace-123',
      'file-456',
      10,
      'Key findings',
      '{"note": "test"}'
    );

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark, mockBookmark2]);
    });
  });

  it('handles create errors by throwing', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(workspaceFileBookmarkApi.listByFile).mockResolvedValue([mockBookmark]);
    vi.mocked(workspaceFileBookmarkApi.create).mockRejectedValue(
      new Error('Failed to create')
    );

    const { result } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', 'file-456')
    );

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark]);
    });

    await expect(
      act(async () => {
        await result.current.createBookmark(10, 'Test');
      })
    ).rejects.toThrow('Failed to create');

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to create bookmark:',
      expect.any(Error)
    );

    consoleError.mockRestore();
  });

  it('deletes a bookmark and reloads', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');
    vi.mocked(workspaceFileBookmarkApi.listByFile)
      .mockResolvedValueOnce([mockBookmark, mockBookmark2])
      .mockResolvedValueOnce([mockBookmark2]);
    vi.mocked(workspaceFileBookmarkApi.delete).mockResolvedValue();

    const { result } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', 'file-456')
    );

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark, mockBookmark2]);
    });

    await act(async () => {
      await result.current.deleteBookmark('bookmark-1');
    });

    expect(workspaceFileBookmarkApi.delete).toHaveBeenCalledWith('bookmark-1');

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark2]);
    });
  });

  it('handles delete errors by throwing', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(workspaceFileBookmarkApi.listByFile).mockResolvedValue([mockBookmark]);
    vi.mocked(workspaceFileBookmarkApi.delete).mockRejectedValue(
      new Error('Failed to delete')
    );

    const { result } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', 'file-456')
    );

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark]);
    });

    await expect(
      act(async () => {
        await result.current.deleteBookmark('bookmark-1');
      })
    ).rejects.toThrow('Failed to delete');

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to delete bookmark:',
      expect.any(Error)
    );

    consoleError.mockRestore();
  });

  it('reloads bookmarks when workspaceFileId changes', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');
    vi.mocked(workspaceFileBookmarkApi.listByFile)
      .mockResolvedValueOnce([mockBookmark])
      .mockResolvedValueOnce([mockBookmark2]);

    const { result, rerender } = renderHook(
      ({ workspaceId, fileId }: { workspaceId: string; fileId: string }) =>
        useWorkspaceFileBookmarkApi(workspaceId, fileId),
      {
        initialProps: { workspaceId: 'workspace-123', fileId: 'file-456' },
      }
    );

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark]);
    });

    rerender({ workspaceId: 'workspace-123', fileId: 'file-789' });

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark2]);
    });

    expect(workspaceFileBookmarkApi.listByFile).toHaveBeenCalledTimes(2);
    expect(workspaceFileBookmarkApi.listByFile).toHaveBeenCalledWith('file-789');
  });

  it('reloads bookmarks on bookmark-created event', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');
    vi.mocked(workspaceFileBookmarkApi.listByFile)
      .mockResolvedValueOnce([mockBookmark])
      .mockResolvedValueOnce([mockBookmark, mockBookmark2]);

    const { result } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', 'file-456')
    );

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark]);
    });

    act(() => {
      window.dispatchEvent(new CustomEvent('bookmark-created'));
    });

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark, mockBookmark2]);
    });

    expect(workspaceFileBookmarkApi.listByFile).toHaveBeenCalledTimes(2);
  });

  it('reloads bookmarks on bookmark-deleted event', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');
    vi.mocked(workspaceFileBookmarkApi.listByFile)
      .mockResolvedValueOnce([mockBookmark, mockBookmark2])
      .mockResolvedValueOnce([mockBookmark]);

    const { result } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', 'file-456')
    );

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark, mockBookmark2]);
    });

    act(() => {
      window.dispatchEvent(new CustomEvent('bookmark-deleted'));
    });

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark]);
    });

    expect(workspaceFileBookmarkApi.listByFile).toHaveBeenCalledTimes(2);
  });

  it('cleans up event listeners on unmount', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');
    vi.mocked(workspaceFileBookmarkApi.listByFile).mockResolvedValue([mockBookmark]);

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', 'file-456')
    );

    await waitFor(() => {
      expect(workspaceFileBookmarkApi.listByFile).toHaveBeenCalled();
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'bookmark-created',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'bookmark-deleted',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it('exposes reloadBookmarks function', async () => {
    const { workspaceFileBookmarkApi } = await import('@/api/WorkspaceFileBookmarkApi');
    vi.mocked(workspaceFileBookmarkApi.listByFile)
      .mockResolvedValueOnce([mockBookmark])
      .mockResolvedValueOnce([mockBookmark, mockBookmark2]);

    const { result } = renderHook(() =>
      useWorkspaceFileBookmarkApi('workspace-123', 'file-456')
    );

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark]);
    });

    await act(async () => {
      await result.current.reloadBookmarks();
    });

    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([mockBookmark, mockBookmark2]);
    });

    expect(workspaceFileBookmarkApi.listByFile).toHaveBeenCalledTimes(2);
  });
});