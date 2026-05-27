import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { usePdfLoader } from '@/features/pdf-viewer/hooks/usePdfLoader';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('usePdfLoader', () => {
  const mockInvoke = invoke as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null values when no path is provided', () => {
    const { result } = renderHook(() => usePdfLoader(null));

    expect(result.current.pdfData).toBeNull();
    expect(result.current.pdfUrl).toBeNull();
    expect(result.current.pdfLoaded).toBe(false);
    expect(result.current.pageCount).toBe(0);
  });

  it('loads PDF data when path is provided', async () => {
    const mockData = [1, 2, 3, 4, 5];
    mockInvoke.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => usePdfLoader('/path/to/test.pdf'));

    // Wait for the invoke call to happen
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });
    
    expect(mockInvoke).toHaveBeenCalledWith('read_pdf_file', { filepath: '/path/to/test.pdf' });

    await waitFor(() => {
      expect(result.current.pdfData).toEqual(new Uint8Array(mockData));
      expect(result.current.pdfUrl).toBe('blob:mock-url');
    });
  });

  it('handles PDF loading error', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('Failed to load PDF'));

    const { result } = renderHook(() => usePdfLoader('/path/to/test.pdf'));

    await waitFor(() => {
      expect(result.current.pdfData).toBeNull();
      expect(result.current.pdfUrl).toBeNull();
    });
  });

  it('cleans up blob URL on unmount', async () => {
    const mockData = [1, 2, 3, 4, 5];
    mockInvoke.mockResolvedValueOnce(mockData);

    const { result, unmount } = renderHook(() => usePdfLoader('/path/to/test.pdf'));

    await waitFor(() => {
      expect(result.current.pdfUrl).toBe('blob:mock-url');
    });

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('reloads PDF when path changes', async () => {
    const mockData1 = [1, 2, 3];
    const mockData2 = [4, 5, 6];
    mockInvoke.mockResolvedValueOnce(mockData1);

    const { result, rerender } = renderHook(
      ({ path }: { path: string | null }) => usePdfLoader(path),
      { initialProps: { path: '/path/to/test1.pdf' as string | null } }
    );

    await waitFor(() => {
      expect(result.current.pdfData).toEqual(new Uint8Array(mockData1));
    });

    mockInvoke.mockResolvedValueOnce(mockData2);
    rerender({ path: '/path/to/test2.pdf' });

    await waitFor(() => {
      expect(result.current.pdfData).toEqual(new Uint8Array(mockData2));
    });

    expect(mockInvoke).toHaveBeenCalledTimes(2);
  });

  it('handles document load event', async () => {
    const { result } = renderHook(() => usePdfLoader(null));

    expect(result.current.pdfLoaded).toBe(false);
    expect(result.current.pageCount).toBe(0);

    const mockEvent = {
      doc: {
        numPages: 10
      }
    };

    await act(async () => {
      result.current.handleDocumentLoad(mockEvent as any);
    });

    expect(result.current.pdfLoaded).toBe(true);
    expect(result.current.pageCount).toBe(10);
  });

  it('resets state when path becomes null', async () => {
    const mockData = [1, 2, 3];
    mockInvoke.mockResolvedValueOnce(mockData);

    const { result, rerender } = renderHook(
      ({ path }: { path: string | null }) => usePdfLoader(path),
      { initialProps: { path: '/path/to/test.pdf' as string | null } }
    );

    await waitFor(() => {
      expect(result.current.pdfData).toEqual(new Uint8Array(mockData));
      expect(result.current.pdfUrl).toBe('blob:mock-url');
    });

    rerender({ path: null });

    expect(result.current.pdfData).toBeNull();
    expect(result.current.pdfUrl).toBeNull();
    expect(result.current.pdfLoaded).toBe(false);
    expect(result.current.pageCount).toBe(0);
  });
});