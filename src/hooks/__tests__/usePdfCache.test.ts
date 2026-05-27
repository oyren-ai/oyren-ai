import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePdfCache } from '@/features/pdf-viewer/hooks/usePdfCache';

// Mock invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}));

// Mock URL.createObjectURL and revokeObjectURL
let urlCounter = 0;
global.URL.createObjectURL = vi.fn(() => `blob:mock-url-${++urlCounter}`);
global.URL.revokeObjectURL = vi.fn();

describe('usePdfCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    urlCounter = 0;
    global.URL.createObjectURL = vi.fn(() => `blob:mock-url-${++urlCounter}`);
  });

  it('returns null for path that is not loaded', () => {
    const { result } = renderHook(() => usePdfCache());

    expect(result.current.getCachedPdf('/test.pdf')).toBeNull();
  });

  it('loads and caches PDF on first request', async () => {
    const mockPdfData = [1, 2, 3, 4, 5];
    mockInvoke.mockResolvedValue(mockPdfData);

    const { result } = renderHook(() => usePdfCache());

    let pdfUrl: string | null = null;
    await act(async () => {
      pdfUrl = await result.current.loadPdf('/test.pdf');
    });

    expect(mockInvoke).toHaveBeenCalledWith('read_pdf_file', { filepath: '/test.pdf' });
    expect(pdfUrl).toBe('blob:mock-url-1');
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('returns cached PDF without reloading', async () => {
    const mockPdfData = [1, 2, 3, 4, 5];
    mockInvoke.mockResolvedValue(mockPdfData);

    const { result } = renderHook(() => usePdfCache());

    // Load first time
    await act(async () => {
      await result.current.loadPdf('/test.pdf');
    });

    expect(mockInvoke).toHaveBeenCalledTimes(1);

    // Get from cache (should not invoke again)
    const cached = result.current.getCachedPdf('/test.pdf');

    expect(cached).toBe('blob:mock-url-1');
    expect(mockInvoke).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it('loads multiple PDFs and caches them separately', async () => {
    mockInvoke
      .mockResolvedValueOnce([1, 2, 3])
      .mockResolvedValueOnce([4, 5, 6]);

    const { result } = renderHook(() => usePdfCache());

    await act(async () => {
      await result.current.loadPdf('/first.pdf');
      await result.current.loadPdf('/second.pdf');
    });

    expect(result.current.getCachedPdf('/first.pdf')).toBe('blob:mock-url-1');
    expect(result.current.getCachedPdf('/second.pdf')).toBe('blob:mock-url-2');
  });

  it('removes PDF from cache and revokes blob URL', async () => {
    mockInvoke.mockResolvedValue([1, 2, 3]);

    const { result } = renderHook(() => usePdfCache());

    await act(async () => {
      await result.current.loadPdf('/test.pdf');
    });

    const cachedUrl = result.current.getCachedPdf('/test.pdf');
    expect(cachedUrl).toBe('blob:mock-url-1');

    act(() => {
      result.current.removePdf('/test.pdf');
    });

    expect(result.current.getCachedPdf('/test.pdf')).toBeNull();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-1');
  });

  it('clears entire cache and revokes all blob URLs', async () => {
    mockInvoke.mockResolvedValue([1, 2, 3]);

    const { result } = renderHook(() => usePdfCache());

    await act(async () => {
      await result.current.loadPdf('/first.pdf');
      await result.current.loadPdf('/second.pdf');
    });

    act(() => {
      result.current.clearCache();
    });

    expect(result.current.getCachedPdf('/first.pdf')).toBeNull();
    expect(result.current.getCachedPdf('/second.pdf')).toBeNull();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('handles loading errors gracefully', async () => {
    mockInvoke.mockRejectedValue(new Error('Failed to load PDF'));

    const { result } = renderHook(() => usePdfCache());

    await expect(async () => {
      await act(async () => {
        await result.current.loadPdf('/bad.pdf');
      });
    }).rejects.toThrow('Failed to load PDF');

    expect(result.current.getCachedPdf('/bad.pdf')).toBeNull();
  });

  it('does not load same PDF twice concurrently', async () => {
    mockInvoke.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve([1, 2, 3]), 100))
    );

    const { result } = renderHook(() => usePdfCache());

    // Start two loads concurrently
    const promise1 = act(async () => await result.current.loadPdf('/test.pdf'));
    const promise2 = act(async () => await result.current.loadPdf('/test.pdf'));

    await Promise.all([promise1, promise2]);

    // Should only invoke once
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });
});