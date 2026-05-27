import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workspaceFilesApi } from '../workspaceFilesApi';
import type { WorkspaceFile } from '../../types/workspace';

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('workspaceFilesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getByWorkspaceId', () => {
    it('should call invoke with correct command and workspace_id', async () => {
      const mockFiles: WorkspaceFile[] = [
        {
          id: 'file-1',
          workspace_id: 'workspace-123',
          file_path: '/path/to/document.pdf',
          file_name: 'document.pdf',
          added_at: '2025-01-01T00:00:00Z',
          last_accessed_at: '2025-01-01T00:00:00Z',
          is_visible: true,
          is_read_only: true,
          metadata: undefined,
        },
      ];

      vi.mocked(invoke).mockResolvedValue(mockFiles);

      const result = await workspaceFilesApi.listWorkspaceFiles('workspace-123', false);

      expect(invoke).toHaveBeenCalledWith('list_workspace_files', {
        isNotIntersection: false,
        workspaceId: 'workspace-123',
      });
      expect(result).toEqual(mockFiles);
    });

    it('should return empty array when no files exist', async () => {
      vi.mocked(invoke).mockResolvedValue([]);

      const result = await workspaceFilesApi.listWorkspaceFiles('workspace-empty', false);

      expect(invoke).toHaveBeenCalledWith('list_workspace_files', {
        isNotIntersection: false,
        workspaceId: 'workspace-empty',
      });
      expect(result).toEqual([]);
    });

    it('should return multiple files ordered by added_at', async () => {
      const mockFiles: WorkspaceFile[] = [
        {
          id: 'file-3',
          workspace_id: 'workspace-123',
          file_path: '/path/to/doc3.pdf',
          file_name: 'doc3.pdf',
          added_at: '2025-01-03T00:00:00Z',
          last_accessed_at: '2025-01-03T00:00:00Z',
          is_visible: true,
          is_read_only: true,
        },
        {
          id: 'file-2',
          workspace_id: 'workspace-123',
          file_path: '/path/to/doc2.pdf',
          file_name: 'doc2.pdf',
          added_at: '2025-01-02T00:00:00Z',
          last_accessed_at: '2025-01-02T00:00:00Z',
          is_visible: true,
          is_read_only: true,
        },
        {
          id: 'file-1',
          workspace_id: 'workspace-123',
          file_path: '/path/to/doc1.pdf',
          file_name: 'doc1.pdf',
          added_at: '2025-01-01T00:00:00Z',
          last_accessed_at: '2025-01-01T00:00:00Z',
          is_visible: true,
          is_read_only: true,
        },
      ];

      vi.mocked(invoke).mockResolvedValue(mockFiles);

      const result = await workspaceFilesApi.listWorkspaceFiles('workspace-123', false);

      expect(result).toHaveLength(3);
      expect(result[0].file_name).toBe('doc3.pdf'); // Most recent first
      expect(result[1].file_name).toBe('doc2.pdf');
      expect(result[2].file_name).toBe('doc1.pdf');
    });

    it('should handle files with metadata', async () => {
      const mockFiles: WorkspaceFile[] = [
        {
          id: 'file-1',
          workspace_id: 'workspace-123',
          file_path: '/path/to/doc.pdf',
          file_name: 'doc.pdf',
          added_at: '2025-01-01T00:00:00Z',
          last_accessed_at: '2025-01-01T00:00:00Z',
          is_visible: true,
          is_read_only: true,
          metadata: '{"page_count": 10, "file_size": 1024}',
        },
      ];

      vi.mocked(invoke).mockResolvedValue(mockFiles);

      const result = await workspaceFilesApi.listWorkspaceFiles('workspace-123', false);

      expect(result[0].metadata).toBe('{"page_count": 10, "file_size": 1024}');
    });

    it('should handle invoke errors', async () => {
      const error = new Error('Failed to get workspace files');
      vi.mocked(invoke).mockRejectedValue(error);

      await expect(
        workspaceFilesApi.listWorkspaceFiles('workspace-123', false)
      ).rejects.toThrow('Failed to get workspace files');
    });

    it('should only return visible files', async () => {
      const mockFiles: WorkspaceFile[] = [
        {
          id: 'file-1',
          workspace_id: 'workspace-123',
          file_path: '/path/to/visible.pdf',
          file_name: 'visible.pdf',
          added_at: '2025-01-01T00:00:00Z',
          last_accessed_at: '2025-01-01T00:00:00Z',
          is_visible: true,
          is_read_only: true,
        },
        {
          id: 'file-2',
          workspace_id: 'workspace-123',
          file_path: '/path/to/visible2.pdf',
          file_name: 'visible2.pdf',
          added_at: '2025-01-02T00:00:00Z',
          last_accessed_at: '2025-01-02T00:00:00Z',
          is_visible: true,
          is_read_only: true,
        },
      ];

      vi.mocked(invoke).mockResolvedValue(mockFiles);

      const result = await workspaceFilesApi.listWorkspaceFiles('workspace-123', false);

      // Should only have visible files (backend filters, but we verify the contract)
      expect(result.every((file) => file.is_visible)).toBe(true);
    });
  });

  describe('addFile', () => {
    it('should add file to workspace successfully', async () => {
      const workspaceId = 'workspace-123';
      const sourceFilePath = '/path/to/document.pdf';
      const mockResult = {
        workspace_file_id: 'file-456',
        workspace_file_path: '/app_data/workspaces/workspace-123/document.pdf',
        original_filename: 'document.pdf',
        was_deduplicated: false,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResult);

      const result = await workspaceFilesApi.addFile(workspaceId, sourceFilePath);

      expect(invoke).toHaveBeenCalledWith('create_workspace_file', {
        workspaceId,
        sourceFilePath,
      });
      expect(result).toEqual(mockResult);
      expect(result.was_deduplicated).toBe(false);
    });

    it('should handle deduplicated file', async () => {
      const workspaceId = 'workspace-123';
      const sourceFilePath = '/path/to/existing.pdf';
      const mockResult = {
        workspace_file_id: 'file-existing',
        workspace_file_path: '/app_data/workspaces/workspace-123/existing.pdf',
        original_filename: 'existing.pdf',
        was_deduplicated: true,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResult);

      const result = await workspaceFilesApi.addFile(workspaceId, sourceFilePath);

      expect(result.was_deduplicated).toBe(true);
      expect(result.workspace_file_id).toBe('file-existing');
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('File not found');
      vi.mocked(invoke).mockRejectedValueOnce(error);

      await expect(
        workspaceFilesApi.addFile('workspace-123', '/invalid/path.pdf')
      ).rejects.toThrow('File not found');
    });
  });

  describe('removeFile', () => {
    it('should remove file from workspace successfully', async () => {
      const workspaceFileId = 'file-456';

      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await workspaceFilesApi.removeFile(workspaceFileId);

      expect(invoke).toHaveBeenCalledWith('delete_workspace_file', {
        workspaceFileId,
      });
    });

    it('should handle UUID format file ids', async () => {
      const uuidFileId = '550e8400-e29b-41d4-a716-446655440000';

      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await workspaceFilesApi.removeFile(uuidFileId);

      expect(invoke).toHaveBeenCalledWith('delete_workspace_file', {
        workspaceFileId: uuidFileId,
      });
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('File not found in database');
      vi.mocked(invoke).mockRejectedValueOnce(error);

      await expect(
        workspaceFilesApi.removeFile('non-existent-id')
      ).rejects.toThrow('File not found in database');
    });
  });

  describe('updateFileName', () => {
    it('should rename file successfully', async () => {
      const workspaceFileId = 'file-456';
      const newFileName = 'renamed-document.pdf';

      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await workspaceFilesApi.updateFileName(workspaceFileId, newFileName);

      expect(invoke).toHaveBeenCalledWith('rename_workspace_file', {
        workspaceFileId,
        newFileName,
      });
    });

    it('should handle UUID format file ids', async () => {
      const uuidFileId = '550e8400-e29b-41d4-a716-446655440000';
      const newFileName = 'new-name.pdf';

      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await workspaceFilesApi.updateFileName(uuidFileId, newFileName);

      expect(invoke).toHaveBeenCalledWith('rename_workspace_file', {
        workspaceFileId: uuidFileId,
        newFileName,
      });
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('File not found in database');
      vi.mocked(invoke).mockRejectedValueOnce(error);

      await expect(
        workspaceFilesApi.updateFileName('non-existent-id', 'new.pdf')
      ).rejects.toThrow('File not found in database');
    });

    it('should handle special characters in filename', async () => {
      const workspaceFileId = 'file-456';
      const newFileName = 'my file (2024).pdf';

      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await workspaceFilesApi.updateFileName(workspaceFileId, newFileName);

      expect(invoke).toHaveBeenCalledWith('rename_workspace_file', {
        workspaceFileId,
        newFileName,
      });
    });
  });
});