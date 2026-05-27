import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAddFileFromUrl } from '../useAddFileFromUrl';

vi.mock('@/api/workspaceApi', () => ({
  workspaceApi: { downloadArxivPaper: vi.fn() },
}));

vi.mock('@/api/workspaceFilesApi', () => ({
  workspaceFilesApi: { getWorkspaceFile: vi.fn() },
}));

describe('useAddFileFromUrl', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns loading false and no error initially', () => {
    const { result } = renderHook(() => useAddFileFromUrl('ws-1'));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error for invalid URL', async () => {
    const { result } = renderHook(() => useAddFileFromUrl('ws-1'));
    await act(async () => { await result.current.downloadFromUrl('not-a-url'); });
    expect(result.current.error).toBe('Please enter a valid URL');
  });

  it('sets error when no workspace ID', async () => {
    const { result } = renderHook(() => useAddFileFromUrl(undefined));
    await act(async () => { await result.current.downloadFromUrl('https://example.com/p.pdf'); });
    expect(result.current.error).toBe('No workspace selected');
  });

  it('calls downloadArxivPaper on valid URL', async () => {
    const { workspaceApi } = await import('@/api/workspaceApi');
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
    (workspaceApi.downloadArxivPaper as ReturnType<typeof vi.fn>).mockResolvedValue('file-1');
    (workspaceFilesApi.getWorkspaceFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'file-1', file_path: '/ws/file.pdf',
    });

    const { result } = renderHook(() => useAddFileFromUrl('ws-1'));
    await act(async () => { await result.current.downloadFromUrl('https://example.com/paper.pdf'); });

    expect(workspaceApi.downloadArxivPaper).toHaveBeenCalledWith('ws-1', 'https://example.com/paper.pdf', 'paper.pdf');
  });

  it('dispatches events on success', async () => {
    const { workspaceApi } = await import('@/api/workspaceApi');
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
    (workspaceApi.downloadArxivPaper as ReturnType<typeof vi.fn>).mockResolvedValue('file-1');
    (workspaceFilesApi.getWorkspaceFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'file-1', file_path: '/ws/file.pdf',
    });

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { result } = renderHook(() => useAddFileFromUrl('ws-1'));
    await act(async () => { await result.current.downloadFromUrl('https://example.com/paper.pdf'); });

    const eventNames = dispatchSpy.mock.calls.map(c => (c[0] as CustomEvent).type);
    expect(eventNames).toContain('workspace-files-changed');
    expect(eventNames).toContain('open-workspace-file');
    dispatchSpy.mockRestore();
  });

  it('sets error on download failure', async () => {
    const { workspaceApi } = await import('@/api/workspaceApi');
    (workspaceApi.downloadArxivPaper as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAddFileFromUrl('ws-1'));
    await act(async () => { await result.current.downloadFromUrl('https://example.com/paper.pdf'); });

    expect(result.current.error).toBe('Network error');
  });

  it('resets error with resetError', async () => {
    const { result } = renderHook(() => useAddFileFromUrl('ws-1'));
    await act(async () => { await result.current.downloadFromUrl('not-a-url'); });
    expect(result.current.error).not.toBeNull();

    act(() => { result.current.resetError(); });
    expect(result.current.error).toBeNull();
  });

  it('sets loading during download', async () => {
    const { workspaceApi } = await import('@/api/workspaceApi');
    const { workspaceFilesApi } = await import('@/api/workspaceFilesApi');
    let resolveDownload: (v: string) => void = () => {};
    (workspaceApi.downloadArxivPaper as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise<string>((r) => { resolveDownload = r; })
    );
    (workspaceFilesApi.getWorkspaceFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'file-1', file_path: '/ws/file.pdf',
    });

    const { result } = renderHook(() => useAddFileFromUrl('ws-1'));
    let downloadPromise: Promise<boolean>;
    act(() => { downloadPromise = result.current.downloadFromUrl('https://example.com/paper.pdf'); });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => { resolveDownload('file-1'); await downloadPromise!; });
    expect(result.current.loading).toBe(false);
  });
});
