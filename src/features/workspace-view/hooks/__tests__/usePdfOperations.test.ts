import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePdfOperations } from '../usePdfOperations';
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

describe('usePdfOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with loading false', () => {
    const mockSetPdfPath = vi.fn();
    const mockSetSessionId = vi.fn();

    const { result } = renderHook(() =>
      usePdfOperations(mockSetPdfPath, mockSetSessionId)
    );

    expect(result.current.loading).toBe(false);
  });

  it('requires workspace to open PDF files', async () => {
    const mockSetPdfPath = vi.fn();
    const mockSetSessionId = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      usePdfOperations(mockSetPdfPath, mockSetSessionId)
    );

    await act(async () => {
      await result.current.handleOpenPdf();
    });

    await waitFor(() => {
      // Should log error when no workspace
      expect(consoleError).toHaveBeenCalledWith('Error copying PDF to workspace:', expect.any(Error));
      expect(mockSetPdfPath).not.toHaveBeenCalled();
      expect(mockSetSessionId).not.toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('handles PDF opening errors', async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const mockSetPdfPath = vi.fn();
    const mockSetSessionId = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    (open as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Dialog error'));

    const { result } = renderHook(() =>
      usePdfOperations(mockSetPdfPath, mockSetSessionId)
    );

    await act(async () => {
      await result.current.handleOpenPdf();
    });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error copying PDF to workspace:', expect.any(Error));
      expect(result.current.loading).toBe(false);
    });

    consoleError.mockRestore();
  });

  it('handles opening PDF by path with workspace file id', () => {
    const mockSetPdfPath = vi.fn();
    const mockSetSessionId = vi.fn();
    const mockSetWorkspaceFileId = vi.fn();
    const testPath = '/path/to/file.pdf';
    const testFileId = 'file-123';

    const { result } = renderHook(() =>
      usePdfOperations(mockSetPdfPath, mockSetSessionId, undefined, mockSetWorkspaceFileId)
    );

    act(() => {
      result.current.handleOpenPdfPath(testPath, testFileId);
    });

    expect(mockSetPdfPath).toHaveBeenCalledWith(testPath);
    expect(mockSetSessionId).toHaveBeenCalledWith(null);
    expect(mockSetWorkspaceFileId).toHaveBeenCalledWith(testFileId);

    // Check localStorage
    const stored = localStorage.getItem('recent-pdfs');
    expect(stored).toBeTruthy();
    if (stored) {
      const recents = JSON.parse(stored);
      expect(recents[0].path).toBe(testPath);
    }
  });

  it('limits recent PDFs to 20 entries', () => {
    const mockSetPdfPath = vi.fn();
    const mockSetSessionId = vi.fn();
    const mockSetWorkspaceFileId = vi.fn();

    const { result } = renderHook(() =>
      usePdfOperations(mockSetPdfPath, mockSetSessionId, undefined, mockSetWorkspaceFileId)
    );

    // Add 25 PDFs
    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.handleOpenPdfPath(`/path/to/file${i}.pdf`, `file-${i}`);
      }
    });

    const stored = localStorage.getItem('recent-pdfs');
    expect(stored).toBeTruthy();
    if (stored) {
      const recents = JSON.parse(stored);
      expect(recents).toHaveLength(20);
      // Most recent should be first
      expect(recents[0].path).toBe('/path/to/file24.pdf');
    }
  });

  it('updates timestamp when reopening same PDF', () => {
    const mockSetPdfPath = vi.fn();
    const mockSetSessionId = vi.fn();
    const mockSetWorkspaceFileId = vi.fn();
    const testPath = '/path/to/same.pdf';
    const testFileId = 'file-same';

    const { result } = renderHook(() =>
      usePdfOperations(mockSetPdfPath, mockSetSessionId, undefined, mockSetWorkspaceFileId)
    );

    // Open same PDF twice
    act(() => {
      result.current.handleOpenPdfPath(testPath, testFileId);
    });

    const firstTimestamp = JSON.parse(localStorage.getItem('recent-pdfs')!)[0].lastOpened;

    // Wait a bit and open again
    act(() => {
      result.current.handleOpenPdfPath(testPath, testFileId);
    });

    const stored = localStorage.getItem('recent-pdfs');
    if (stored) {
      const recents = JSON.parse(stored);
      expect(recents).toHaveLength(1); // Should not duplicate
      expect(recents[0].lastOpened).toBeGreaterThanOrEqual(firstTimestamp);
    }
  });

  describe('workspace file id tracking', () => {
    it('sets workspace file id when opening PDF by path with file id', () => {
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();
      const mockSetWorkspaceFileId = vi.fn();
      const testPath = '/workspace/path/file.pdf';
      const testFileId = 'workspace-file-123';

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, undefined, mockSetWorkspaceFileId)
      );

      act(() => {
        result.current.handleOpenPdfPath(testPath, testFileId);
      });

      expect(mockSetPdfPath).toHaveBeenCalledWith(testPath);
      expect(mockSetSessionId).toHaveBeenCalledWith(null);
      expect(mockSetWorkspaceFileId).toHaveBeenCalledWith(testFileId);
    });

    it('requires workspace file id when opening PDF by path', () => {
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();
      const mockSetWorkspaceFileId = vi.fn();
      const testPath = '/workspace/path/file.pdf';

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, undefined, mockSetWorkspaceFileId)
      );

      // This should require workspace file ID - not accept undefined/null
      expect(() => {
        act(() => {
          // @ts-expect-error Testing that workspaceFileId is required
          result.current.handleOpenPdfPath(testPath);
        });
      }).toThrow();
    });
  });

  describe('workspace integration', () => {
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

    it('copies PDF to workspace and uses workspace path', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();
      const externalPath = '/external/path/document.pdf';
      const workspacePath = '/app_data/workspaces/workspace-123/document.pdf';

      (open as ReturnType<typeof vi.fn>).mockResolvedValue(externalPath);
      (workspaceFilesApi.addFile as ReturnType<typeof vi.fn>).mockResolvedValue({
        workspace_file_id: 'file-456',
        workspace_file_path: workspacePath,
        original_filename: 'document.pdf',
        was_deduplicated: false,
      });

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, mockWorkspace)
      );

      await act(async () => {
        await result.current.handleOpenPdf();
      });

      await waitFor(() => {
        expect(workspaceFilesApi.addFile).toHaveBeenCalledWith(
          mockWorkspace.id,
          externalPath
        );
        expect(mockSetPdfPath).toHaveBeenCalledWith(workspacePath);
        expect(mockSetSessionId).toHaveBeenCalledWith(null);
      });
    });

    it('handles deduplication correctly', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();
      const externalPath = '/external/path/duplicate.pdf';
      const workspacePath = '/app_data/workspaces/workspace-123/existing.pdf';

      (open as ReturnType<typeof vi.fn>).mockResolvedValue(externalPath);
      (workspaceFilesApi.addFile as ReturnType<typeof vi.fn>).mockResolvedValue({
        workspace_file_id: 'file-existing',
        workspace_file_path: workspacePath,
        original_filename: 'duplicate.pdf',
        was_deduplicated: true,
      });

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, mockWorkspace)
      );

      await act(async () => {
        await result.current.handleOpenPdf();
      });

      await waitFor(() => {
        expect(workspaceFilesApi.addFile).toHaveBeenCalled();
        expect(mockSetPdfPath).toHaveBeenCalledWith(workspacePath);
      });
    });

    it('handles addFile errors', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      (open as ReturnType<typeof vi.fn>).mockResolvedValue('/external/path/document.pdf');
      (workspaceFilesApi.addFile as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to copy file')
      );

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, mockWorkspace)
      );

      await act(async () => {
        await result.current.handleOpenPdf();
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error copying PDF to workspace:',
          expect.any(Error)
        );
        expect(mockSetPdfPath).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
      });

      consoleError.mockRestore();
    });

    it('shows error when no workspace is provided', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      (open as ReturnType<typeof vi.fn>).mockResolvedValue('/external/path/document.pdf');

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, undefined)
      );

      await act(async () => {
        await result.current.handleOpenPdf();
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error copying PDF to workspace:',
          expect.any(Error)
        );
        expect(mockSetPdfPath).not.toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('maintains loading state during workspace file copy', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();

      (open as ReturnType<typeof vi.fn>).mockResolvedValue('/external/path/document.pdf');

      let resolveAddFile: (value: any) => void;
      const addFilePromise = new Promise((resolve) => {
        resolveAddFile = resolve;
      });
      (workspaceFilesApi.addFile as ReturnType<typeof vi.fn>).mockReturnValue(addFilePromise);

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, mockWorkspace)
      );

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.handleOpenPdf();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      act(() => {
        resolveAddFile!({
          workspace_file_id: 'file-456',
          workspace_file_path: '/workspace/path.pdf',
          original_filename: 'document.pdf',
          was_deduplicated: false,
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('saves workspace path to recents, not external path', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();
      const externalPath = '/external/path/document.pdf';
      const workspacePath = '/app_data/workspaces/workspace-123/document.pdf';

      (open as ReturnType<typeof vi.fn>).mockResolvedValue(externalPath);
      (workspaceFilesApi.addFile as ReturnType<typeof vi.fn>).mockResolvedValue({
        workspace_file_id: 'file-456',
        workspace_file_path: workspacePath,
        original_filename: 'document.pdf',
        was_deduplicated: false,
      });

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, mockWorkspace)
      );

      await act(async () => {
        await result.current.handleOpenPdf();
      });

      await waitFor(() => {
        const stored = localStorage.getItem('recent-pdfs');
        expect(stored).toBeTruthy();
        if (stored) {
          const recents = JSON.parse(stored);
          expect(recents[0].path).toBe(workspacePath);
          expect(recents[0].path).not.toBe(externalPath);
        }
      });
    });

    it('handles multiple PDF file selection', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();
      const externalPaths = [
        '/external/path/doc1.pdf',
        '/external/path/doc2.pdf',
        '/external/path/doc3.pdf'
      ];
      const workspacePaths = [
        '/workspace/doc1.pdf',
        '/workspace/doc2.pdf',
        '/workspace/doc3.pdf'
      ];

      (open as ReturnType<typeof vi.fn>).mockResolvedValue(externalPaths);
      (workspaceFilesApi.addFile as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          workspace_file_id: 'file-1',
          workspace_file_path: workspacePaths[0],
          original_filename: 'doc1.pdf',
          was_deduplicated: false,
        })
        .mockResolvedValueOnce({
          workspace_file_id: 'file-2',
          workspace_file_path: workspacePaths[1],
          original_filename: 'doc2.pdf',
          was_deduplicated: false,
        })
        .mockResolvedValueOnce({
          workspace_file_id: 'file-3',
          workspace_file_path: workspacePaths[2],
          original_filename: 'doc3.pdf',
          was_deduplicated: false,
        });

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, mockWorkspace)
      );

      await act(async () => {
        await result.current.handleOpenPdf();
      });

      await waitFor(() => {
        // Should call addFile for each selected file
        expect(workspaceFilesApi.addFile).toHaveBeenCalledTimes(3);
        expect(workspaceFilesApi.addFile).toHaveBeenCalledWith(mockWorkspace.id, externalPaths[0]);
        expect(workspaceFilesApi.addFile).toHaveBeenCalledWith(mockWorkspace.id, externalPaths[1]);
        expect(workspaceFilesApi.addFile).toHaveBeenCalledWith(mockWorkspace.id, externalPaths[2]);

        // Should set first file as current
        expect(mockSetPdfPath).toHaveBeenCalledWith(workspacePaths[0]);
        expect(mockSetSessionId).toHaveBeenCalledWith(null);

        // All files should be saved to recents
        const stored = localStorage.getItem('recent-pdfs');
        expect(stored).toBeTruthy();
        if (stored) {
          const recents = JSON.parse(stored);
          expect(recents).toHaveLength(3);
          expect(recents.map((r: any) => r.path)).toEqual([
            workspacePaths[2],
            workspacePaths[1],
            workspacePaths[0],
          ]);
        }
      });
    });

    it('handles user canceling multiple file selection', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();

      (open as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, mockWorkspace)
      );

      await act(async () => {
        await result.current.handleOpenPdf();
      });

      await waitFor(() => {
        expect(mockSetPdfPath).not.toHaveBeenCalled();
        expect(mockSetSessionId).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
      });
    });

    it('handles empty array from file selection', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();

      (open as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, mockWorkspace)
      );

      await act(async () => {
        await result.current.handleOpenPdf();
      });

      await waitFor(() => {
        expect(mockSetPdfPath).not.toHaveBeenCalled();
        expect(mockSetSessionId).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
      });
    });

    it('handles error in middle of multiple file processing', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const externalPaths = ['/path/doc1.pdf', '/path/doc2.pdf'];

      (open as ReturnType<typeof vi.fn>).mockResolvedValue(externalPaths);
      (workspaceFilesApi.addFile as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          workspace_file_id: 'file-1',
          workspace_file_path: '/workspace/doc1.pdf',
          original_filename: 'doc1.pdf',
          was_deduplicated: false,
        })
        .mockRejectedValueOnce(new Error('Failed to copy second file'));

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, mockWorkspace)
      );

      await act(async () => {
        await result.current.handleOpenPdf();
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error copying PDF to workspace:',
          expect.any(Error)
        );
        expect(mockSetPdfPath).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
      });

      consoleError.mockRestore();
    });

    it('handles deduplication in multiple file selection', async () => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
      const mockSetPdfPath = vi.fn();
      const mockSetSessionId = vi.fn();
      const externalPaths = ['/path/new.pdf', '/path/duplicate.pdf'];

      (open as ReturnType<typeof vi.fn>).mockResolvedValue(externalPaths);
      (workspaceFilesApi.addFile as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          workspace_file_id: 'file-new',
          workspace_file_path: '/workspace/new.pdf',
          original_filename: 'new.pdf',
          was_deduplicated: false,
        })
        .mockResolvedValueOnce({
          workspace_file_id: 'file-existing',
          workspace_file_path: '/workspace/existing.pdf',
          original_filename: 'duplicate.pdf',
          was_deduplicated: true,
        });

      const { result } = renderHook(() =>
        usePdfOperations(mockSetPdfPath, mockSetSessionId, mockWorkspace)
      );

      await act(async () => {
        await result.current.handleOpenPdf();
      });

      await waitFor(() => {
        expect(workspaceFilesApi.addFile).toHaveBeenCalledTimes(2);
        expect(mockSetPdfPath).toHaveBeenCalledWith('/workspace/new.pdf');

        const stored = localStorage.getItem('recent-pdfs');
        if (stored) {
          const recents = JSON.parse(stored);
          expect(recents).toHaveLength(2);
        }
      });
    });
  });
});