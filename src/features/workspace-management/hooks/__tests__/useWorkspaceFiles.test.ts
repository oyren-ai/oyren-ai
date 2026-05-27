import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWorkspaceFiles } from '../useWorkspaceFiles';
import type { Workspace, WorkspaceFile } from '@/types/workspace';

// Mock workspace files API
vi.mock('@/api/workspaceFilesApi', () => ({
  workspaceFilesApi: {
    listWorkspaceFiles: vi.fn(),
  },
}));

describe('useWorkspaceFiles', () => {
  const mockWorkspace: Workspace = {
    id: 'workspace-123',
    name: 'Test Workspace',
    description: 'Test Description',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    last_accessed_at: '2024-01-20T00:00:00Z',
    is_pinned: false,
    is_archived: false,
    is_favourite: false,
    is_active: true,
  };

  const mockFile: WorkspaceFile = {
    id: 'file-1',
    workspace_id: 'workspace-123',
    file_path: '/app_data/workspaces/workspace-123/document.pdf',
    file_name: 'document.pdf',
    added_at: '2024-01-01T00:00:00Z',
    last_accessed_at: '2024-01-01T00:00:00Z',
    is_visible: true,
    is_read_only: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty files and not loading', () => {
    const { result } = renderHook(() => useWorkspaceFiles(null));

    expect(result.current.files).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads files when workspace is provided', async () => {
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
    vi.mocked(workspaceFilesApi.listWorkspaceFiles).mockResolvedValue([mockFile]);

    const { result } = renderHook(() => useWorkspaceFiles(mockWorkspace));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(workspaceFilesApi.listWorkspaceFiles).toHaveBeenCalledWith('workspace-123', false);
    expect(result.current.files).toEqual([mockFile]);
  });

  it('sets loading state during file fetch', async () => {
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');

    let resolveFiles: (value: WorkspaceFile[]) => void;
    const filesPromise = new Promise<WorkspaceFile[]>((resolve) => {
      resolveFiles = resolve;
    });

    vi.mocked(workspaceFilesApi.listWorkspaceFiles).mockReturnValue(filesPromise);

    const { result } = renderHook(() => useWorkspaceFiles(mockWorkspace));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    resolveFiles!([mockFile]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.files).toEqual([mockFile]);
  });

  it('handles API errors gracefully', async () => {
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(workspaceFilesApi.listWorkspaceFiles).mockRejectedValue(
      new Error('Failed to load files')
    );

    const { result } = renderHook(() => useWorkspaceFiles(mockWorkspace));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.files).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to load workspace files:',
      expect.any(Error)
    );

    consoleError.mockRestore();
  });

  it('clears files when workspace becomes null', async () => {
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
    vi.mocked(workspaceFilesApi.listWorkspaceFiles).mockResolvedValue([mockFile]);

    const { result, rerender } = renderHook(
      ({ workspace }: { workspace: Workspace | null }) => useWorkspaceFiles(workspace),
      {
        initialProps: { workspace: mockWorkspace as Workspace | null },
      }
    );

    await waitFor(() => {
      expect(result.current.files).toEqual([mockFile]);
    });

    // Change workspace to null
    rerender({ workspace: null });

    expect(result.current.files).toEqual([]);
  });

  it('reloads files when workspace changes', async () => {
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
    const workspace2: Workspace = {
      ...mockWorkspace,
      id: 'workspace-456',
      name: 'Second Workspace',
    };

    const file1: WorkspaceFile = { ...mockFile, id: 'file-1', workspace_id: 'workspace-123' };
    const file2: WorkspaceFile = { ...mockFile, id: 'file-2', workspace_id: 'workspace-456' };

    vi.mocked(workspaceFilesApi.listWorkspaceFiles)
      .mockResolvedValueOnce([file1])
      .mockResolvedValueOnce([file2]);

    const { result, rerender } = renderHook(
      ({ workspace }: { workspace: Workspace | null }) => useWorkspaceFiles(workspace),
      {
        initialProps: { workspace: mockWorkspace as Workspace | null },
      }
    );

    await waitFor(() => {
      expect(result.current.files).toEqual([file1]);
    });

    // Change to second workspace
    rerender({ workspace: workspace2 });

    await waitFor(() => {
      expect(result.current.files).toEqual([file2]);
    });

    expect(workspaceFilesApi.listWorkspaceFiles).toHaveBeenCalledTimes(2);
  });

  it('does not fetch files when workspace is undefined', async () => {
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');

    renderHook(() => useWorkspaceFiles(undefined));

    expect(workspaceFilesApi.listWorkspaceFiles).not.toHaveBeenCalled();
  });
});