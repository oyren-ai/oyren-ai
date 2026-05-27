import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAddFilesToWorkspace } from '../useAddFilesToWorkspace';
import type { Workspace } from '@/types/workspace';

// Mock Tauri dialog
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));

// Mock workspace files API
vi.mock('@/api/workspaceFilesApi', () => ({
  workspaceFilesApi: {
    addFile: vi.fn(),
  },
}));

describe('useAddFilesToWorkspace', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets workspace file ID when adding files', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
    const mockSetPdfPath = vi.fn();
    const mockSetWorkspaceFileId = vi.fn();
    const externalPath = '/external/path/document.pdf';
    const workspacePath = '/workspace/document.pdf';
    const workspaceFileId = 'file-456';

    (open as ReturnType<typeof vi.fn>).mockResolvedValue(externalPath);
    (workspaceFilesApi.addFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspace_file_id: workspaceFileId,
      workspace_file_path: workspacePath,
      original_filename: 'document.pdf',
      was_deduplicated: false,
    });

    const { result } = renderHook(() =>
      useAddFilesToWorkspace(mockWorkspace, mockSetPdfPath, mockSetWorkspaceFileId)
    );

    await act(async () => {
      await result.current.addFilesToWorkspace();
    });

    await waitFor(() => {
      expect(mockSetPdfPath).toHaveBeenCalledWith(workspacePath);
      expect(mockSetWorkspaceFileId).toHaveBeenCalledWith(workspaceFileId);
    });
  });

  it('requires setCurrentWorkspaceFileId parameter', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
    const mockSetPdfPath = vi.fn();
    const externalPath = '/external/path/document.pdf';

    (open as ReturnType<typeof vi.fn>).mockResolvedValue(externalPath);
    (workspaceFilesApi.addFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      workspace_file_id: 'file-456',
      workspace_file_path: '/workspace/document.pdf',
      original_filename: 'document.pdf',
      was_deduplicated: false,
    });

    // Without setCurrentWorkspaceFileId, the hook should work but not set file ID
    const { result } = renderHook(() =>
      useAddFilesToWorkspace(mockWorkspace, mockSetPdfPath, undefined)
    );

    await act(async () => {
      await result.current.addFilesToWorkspace();
    });

    await waitFor(() => {
      expect(mockSetPdfPath).toHaveBeenCalled();
      // Workspace file ID should still be set if the setter is provided
    });
  });
});
