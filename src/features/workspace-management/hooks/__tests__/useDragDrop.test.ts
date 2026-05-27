import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDragDrop } from '../useDragDrop';
import type { Workspace } from '@/types/workspace';

// Mock Tauri API
const mockOnDragDropEvent = vi.fn();
const mockGetCurrentWindow = vi.fn(() => ({
  onDragDropEvent: mockOnDragDropEvent,
}));

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => mockGetCurrentWindow(),
}));

describe('useDragDrop', () => {
  const mockWorkspace: Workspace = {
    id: 'workspace-123',
    name: 'Test Workspace',
    description: 'Test',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_accessed_at: '2024-01-01T00:00:00Z',
    is_pinned: false,
    is_archived: false,
    is_favourite: false,
    is_active: true,
  };

  const mockOnFilesDropped = vi.fn();
  let unlistenFn: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock unlisten function
    unlistenFn = vi.fn();
    mockOnDragDropEvent.mockResolvedValue(unlistenFn);
  });

  describe('Initialization', () => {
    it('initializes with isDragging false', () => {
      const { result } = renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      expect(result.current.isDragging).toBe(false);
    });

    it('sets up drag-drop listener on mount', async () => {
      renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => {
        expect(mockGetCurrentWindow).toHaveBeenCalled();
        expect(mockOnDragDropEvent).toHaveBeenCalled();
      });
    });

    it('handles error when setting up drag-drop listener fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetCurrentWindow.mockImplementationOnce(() => {
        throw new Error('Window not found');
      });

      renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to setup drag-drop listener:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Drag Events', () => {
    it('sets isDragging to true on drag enter', async () => {
      let dragEventHandler: ((event: any) => void) | null = null;

      mockOnDragDropEvent.mockImplementationOnce((handler: any) => {
        dragEventHandler = handler;
        return Promise.resolve(unlistenFn);
      });

      const { result } = renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => expect(dragEventHandler).not.toBeNull());

      act(() => {
        dragEventHandler?.({
          payload: {
            type: 'enter',
            paths: [],
          },
        });
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('sets isDragging to false on drag leave', async () => {
      let dragEventHandler: ((event: any) => void) | null = null;

      mockOnDragDropEvent.mockImplementationOnce((handler: any) => {
        dragEventHandler = handler;
        return Promise.resolve(unlistenFn);
      });

      const { result } = renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => expect(dragEventHandler).not.toBeNull());

      // Enter then leave
      act(() => {
        dragEventHandler?.({ payload: { type: 'enter', paths: [] } });
      });

      expect(result.current.isDragging).toBe(true);

      act(() => {
        dragEventHandler?.({ payload: { type: 'leave', paths: [] } });
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('File Drop Handling', () => {
    it('processes PDF files on drop event', async () => {
      let dragEventHandler: ((event: any) => void) | null = null;

      mockOnDragDropEvent.mockImplementationOnce((handler: any) => {
        dragEventHandler = handler;
        return Promise.resolve(unlistenFn);
      });

      renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => expect(dragEventHandler).not.toBeNull());

      act(() => {
        dragEventHandler?.({
          payload: {
            type: 'drop',
            paths: ['/path/to/document.pdf', '/path/to/another.pdf'],
          },
        });
      });

      await waitFor(() => {
        expect(mockOnFilesDropped).toHaveBeenCalledWith([
          '/path/to/document.pdf',
          '/path/to/another.pdf',
        ]);
      });
    });

    it('filters out non-PDF files', async () => {
      let dragEventHandler: ((event: any) => void) | null = null;

      mockOnDragDropEvent.mockImplementationOnce((handler: any) => {
        dragEventHandler = handler;
        return Promise.resolve(unlistenFn);
      });

      renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => expect(dragEventHandler).not.toBeNull());

      act(() => {
        dragEventHandler?.({
          payload: {
            type: 'drop',
            paths: ['/path/to/document.pdf', '/path/to/image.png', '/path/to/doc.docx'],
          },
        });
      });

      await waitFor(() => {
        expect(mockOnFilesDropped).toHaveBeenCalledWith(['/path/to/document.pdf']);
      });
    });

    it('handles PDF files with uppercase extension', async () => {
      let dragEventHandler: ((event: any) => void) | null = null;

      mockOnDragDropEvent.mockImplementationOnce((handler: any) => {
        dragEventHandler = handler;
        return Promise.resolve(unlistenFn);
      });

      renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => expect(dragEventHandler).not.toBeNull());

      act(() => {
        dragEventHandler?.({
          payload: {
            type: 'drop',
            paths: ['/path/to/document.PDF', '/path/to/another.Pdf'],
          },
        });
      });

      await waitFor(() => {
        expect(mockOnFilesDropped).toHaveBeenCalledWith([
          '/path/to/document.PDF',
          '/path/to/another.Pdf',
        ]);
      });
    });

    it('does not process files when no PDFs are dropped', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      let dragEventHandler: ((event: any) => void) | null = null;

      mockOnDragDropEvent.mockImplementationOnce((handler: any) => {
        dragEventHandler = handler;
        return Promise.resolve(unlistenFn);
      });

      renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => expect(dragEventHandler).not.toBeNull());

      act(() => {
        dragEventHandler?.({
          payload: {
            type: 'drop',
            paths: ['/path/to/image.png', '/path/to/doc.docx'],
          },
        });
      });

      expect(mockOnFilesDropped).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('No PDF files in dropped items');

      consoleWarnSpy.mockRestore();
    });

    it('does not process files when no workspace is selected', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      let dragEventHandler: ((event: any) => void) | null = null;

      mockOnDragDropEvent.mockImplementationOnce((handler: any) => {
        dragEventHandler = handler;
        return Promise.resolve(unlistenFn);
      });

      renderHook(() =>
        useDragDrop({ workspace: null, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => expect(dragEventHandler).not.toBeNull());

      act(() => {
        dragEventHandler?.({
          payload: {
            type: 'drop',
            paths: ['/path/to/document.pdf'],
          },
        });
      });

      expect(mockOnFilesDropped).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('No workspace selected for file drop');

      consoleWarnSpy.mockRestore();
    });

    it('prevents duplicate processing of same drop event using debounce', async () => {
      let dragEventHandler: ((event: any) => void) | null = null;

      mockOnDragDropEvent.mockImplementationOnce((handler: any) => {
        dragEventHandler = handler;
        return Promise.resolve(unlistenFn);
      });

      renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => expect(dragEventHandler).not.toBeNull());

      // Trigger drop twice in quick succession (within 300ms debounce window)
      act(() => {
        dragEventHandler?.({
          payload: { type: 'drop', paths: ['/path/to/document.pdf'] },
        });

        // Second drop immediately after (should be ignored by debounce)
        dragEventHandler?.({
          payload: { type: 'drop', paths: ['/path/to/another.pdf'] },
        });
      });

      await waitFor(() => {
        // Should only process the first drop (the second is silently ignored by isProcessingRef check)
        expect(mockOnFilesDropped).toHaveBeenCalledTimes(1);
        expect(mockOnFilesDropped).toHaveBeenCalledWith(['/path/to/document.pdf']);
      });
    });

    it('allows processing after debounce window expires', async () => {
      let dragEventHandler: ((event: any) => void) | null = null;

      mockOnDragDropEvent.mockImplementationOnce((handler: any) => {
        dragEventHandler = handler;
        return Promise.resolve(unlistenFn);
      });

      renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => expect(dragEventHandler).not.toBeNull());

      // First drop
      act(() => {
        dragEventHandler?.({
          payload: { type: 'drop', paths: ['/path/to/document.pdf'] },
        });
      });

      await waitFor(() => {
        expect(mockOnFilesDropped).toHaveBeenCalledTimes(1);
      });

      // Wait for debounce window to expire (300ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 400));

      // the second drop should now work
      act(() => {
        dragEventHandler?.({
          payload: { type: 'drop', paths: ['/path/to/another.pdf'] },
        });
      });

      await waitFor(() => {
        expect(mockOnFilesDropped).toHaveBeenCalledTimes(2);
        expect(mockOnFilesDropped).toHaveBeenLastCalledWith(['/path/to/another.pdf']);
      });
    });

    it('sets isDragging to false after drop', async () => {
      let dragEventHandler: ((event: any) => void) | null = null;

      mockOnDragDropEvent.mockImplementationOnce((handler: any) => {
        dragEventHandler = handler;
        return Promise.resolve(unlistenFn);
      });

      const { result } = renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => expect(dragEventHandler).not.toBeNull());

      act(() => {
        dragEventHandler?.({ payload: { type: 'enter', paths: [] } });
      });

      expect(result.current.isDragging).toBe(true);

      act(() => {
        dragEventHandler?.({
          payload: { type: 'drop', paths: ['/path/to/document.pdf'] },
        });
      });

      await waitFor(() => {
        expect(result.current.isDragging).toBe(false);
      });
    });
  });

  describe('Cleanup', () => {
    it('calls unlisten function on unmount', async () => {
      const { unmount } = renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => {
        expect(mockOnDragDropEvent).toHaveBeenCalled();
      });

      unmount();

      expect(unlistenFn).toHaveBeenCalled();
    });

    it('handles cleanup when unlisten is undefined', async () => {
      mockOnDragDropEvent.mockResolvedValueOnce(undefined);

      const { unmount } = renderHook(() =>
        useDragDrop({ workspace: mockWorkspace, onFilesDropped: mockOnFilesDropped })
      );

      await waitFor(() => {
        expect(mockOnDragDropEvent).toHaveBeenCalled();
      });

      // Should not throw
      expect(() => unmount()).not.toThrow();
    });
  });
});
