import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileMention } from './useFileMention';
import { workspaceFilesApi } from '@/api/workspaceFilesApi';
import type { WorkspaceFile } from '@/types/workspace';

// Mock the API
vi.mock('@/api/workspaceFilesApi', () => ({
  workspaceFilesApi: {
    listWorkspaceFiles: vi.fn(),
  },
}));

describe('useFileMention', () => {
  const mockFiles: WorkspaceFile[] = [
    {
      id: '1',
      file_name: 'document.pdf',
      file_path: '/path/to/document.pdf',
      workspace_id: 'ws-1',
      added_at: '2024-01-01',
      last_accessed_at: '2024-01-01',
      is_visible: true,
      is_read_only: false,
    },
    {
      id: '2',
      file_name: 'notes.pdf',
      file_path: '/path/to/notes.pdf',
      workspace_id: 'ws-1',
      added_at: '2024-01-01',
      last_accessed_at: '2024-01-01',
      is_visible: true,
      is_read_only: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workspaceFilesApi.listWorkspaceFiles).mockResolvedValue(mockFiles);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: '',
        onInputChange: vi.fn(),
      })
    );

    expect(result.current.showMentionPopup).toBe(false);
    expect(result.current.mentionFiles).toEqual([]);
    expect(result.current.selectedFiles).toEqual([]);
    expect(result.current.mentionSearchQuery).toBe('');
  });

  it('should show popup when @ is typed at start', () => {
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: '@',
        onInputChange: vi.fn(),
      })
    );

    act(() => {
      result.current.checkForMention('@', 1);
    });

    expect(result.current.showMentionPopup).toBe(true);
  });

  it('should show popup when @ is typed after space', () => {
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: 'hello @',
        onInputChange: vi.fn(),
      })
    );

    act(() => {
      result.current.checkForMention('hello @', 7);
    });

    expect(result.current.showMentionPopup).toBe(true);
  });

  it('should extract search query after @', () => {
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: '@doc',
        onInputChange: vi.fn(),
      })
    );

    act(() => {
      result.current.checkForMention('@doc', 4);
    });

    expect(result.current.showMentionPopup).toBe(true);
    expect(result.current.mentionSearchQuery).toBe('doc');
  });

  it('should close popup when space is typed after query', () => {
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: '@doc ',
        onInputChange: vi.fn(),
      })
    );

    act(() => {
      result.current.checkForMention('@doc ', 5);
    });

    expect(result.current.showMentionPopup).toBe(false);
  });

  it('should load files when popup opens', async () => {
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: '@',
        onInputChange: vi.fn(),
      })
    );

    act(() => {
      result.current.checkForMention('@', 1);
    });

    await waitFor(() => {
      expect(workspaceFilesApi.listWorkspaceFiles).toHaveBeenCalledWith('ws-1', false);
    });
  });

  it('should sort current file first', async () => {
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: '/path/to/notes.pdf',
        inputValue: '@',
        onInputChange: vi.fn(),
      })
    );

    act(() => {
      result.current.checkForMention('@', 1);
    });

    await waitFor(() => {
      expect(result.current.mentionFiles.length).toBe(2);
      expect(result.current.mentionFiles[0].file_path).toBe('/path/to/notes.pdf');
    });
  });

  it('should add file to selected files on select', async () => {
    const onInputChange = vi.fn();
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: '@',
        onInputChange,
      })
    );

    act(() => {
      result.current.checkForMention('@', 1);
    });

    await waitFor(() => {
      expect(result.current.mentionFiles.length).toBe(2);
    });

    act(() => {
      result.current.onSelectFile(mockFiles[0]);
    });

    expect(result.current.selectedFiles).toHaveLength(1);
    expect(result.current.selectedFiles[0].id).toBe('1');
    expect(result.current.showMentionPopup).toBe(false);
  });

  it('should not add duplicate files', async () => {
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: '@',
        onInputChange: vi.fn(),
      })
    );

    act(() => {
      result.current.checkForMention('@', 1);
    });

    await waitFor(() => {
      expect(result.current.mentionFiles.length).toBe(2);
    });

    act(() => {
      result.current.onSelectFile(mockFiles[0]);
    });

    act(() => {
      result.current.onSelectFile(mockFiles[0]);
    });

    expect(result.current.selectedFiles).toHaveLength(1);
  });

  it('should remove file from selected files', async () => {
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: '@',
        onInputChange: vi.fn(),
      })
    );

    act(() => {
      result.current.checkForMention('@', 1);
    });

    await waitFor(() => {
      expect(result.current.mentionFiles.length).toBe(2);
    });

    act(() => {
      result.current.onSelectFile(mockFiles[0]);
    });

    expect(result.current.selectedFiles).toHaveLength(1);

    act(() => {
      result.current.onRemoveFile('1');
    });

    expect(result.current.selectedFiles).toHaveLength(0);
  });

  it('should close popup manually', () => {
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: '@',
        onInputChange: vi.fn(),
      })
    );

    act(() => {
      result.current.checkForMention('@', 1);
    });

    expect(result.current.showMentionPopup).toBe(true);

    act(() => {
      result.current.onCloseMentionPopup();
    });

    expect(result.current.showMentionPopup).toBe(false);
  });

  it('should not load files without workspaceId', async () => {
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: undefined,
        currentPdfPath: null,
        inputValue: '@',
        onInputChange: vi.fn(),
      })
    );

    act(() => {
      result.current.checkForMention('@', 1);
    });

    expect(result.current.showMentionPopup).toBe(true);
    expect(workspaceFilesApi.listWorkspaceFiles).not.toHaveBeenCalled();
  });

  it('should remove @query from input when file is selected', async () => {
    const onInputChange = vi.fn();
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: '@doc',
        onInputChange,
      })
    );

    act(() => {
      result.current.checkForMention('@doc', 4);
    });

    await waitFor(() => {
      expect(result.current.mentionFiles.length).toBe(2);
    });

    act(() => {
      result.current.onSelectFile(mockFiles[0]);
    });

    expect(onInputChange).toHaveBeenCalledWith('');
  });

  it('should preserve other text when removing @query', async () => {
    const onInputChange = vi.fn();
    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: 'hello @doc world',
        onInputChange,
      })
    );

    act(() => {
      result.current.checkForMention('hello @doc world', 10);
    });

    await waitFor(() => {
      expect(result.current.mentionFiles.length).toBe(2);
    });

    act(() => {
      result.current.onSelectFile(mockFiles[0]);
    });

    expect(onInputChange).toHaveBeenCalledWith('hello  world');
  });


  it('should filter out Notes (MDX), non-PDF and non-Markdown files', async () => {
    const mixedFiles: WorkspaceFile[] = [
      ...mockFiles,
      {
        id: '3',
        file_name: 'readme.md',
        file_path: '/path/to/readme.md',
        workspace_id: 'ws-1',
        added_at: '2024-01-01',
        last_accessed_at: '2024-01-01',
        is_visible: true,
        is_read_only: false,
        // no metadata → categorized as Notes, excluded from mention list
      },
      {
        id: '4',
        file_name: 'report.txt',
        file_path: '/path/to/report.txt',
        workspace_id: 'ws-1',
        added_at: '2024-01-01',
        last_accessed_at: '2024-01-01',
        is_visible: true,
        is_read_only: false,
      },
    ];

    vi.mocked(workspaceFilesApi.listWorkspaceFiles).mockResolvedValue(mixedFiles);

    const { result } = renderHook(() =>
      useFileMention({
        workspaceId: 'ws-1',
        currentPdfPath: null,
        inputValue: '@',
        onInputChange: vi.fn(),
      })
    );

    act(() => {
      result.current.checkForMention('@', 1);
    });

    await waitFor(() => {
      // Only Documents (PDF) and Scans (.md from PDF). Notes (readme.md) and .txt excluded.
      expect(result.current.mentionFiles.length).toBe(2);
      expect(result.current.mentionFiles.map(f => f.file_name)).toEqual(
        expect.arrayContaining(['document.pdf', 'notes.pdf'])
      );
    });
  });
});
