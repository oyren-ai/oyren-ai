import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAddFileDialog } from '../useAddFileDialog';

vi.mock('../useAddFilesToWorkspace', () => ({
  useAddFilesToWorkspace: vi.fn(() => ({
    loading: false, addFilesToWorkspace: vi.fn(),
  })),
}));

vi.mock('../useAddFileFromUrl', () => ({
  useAddFileFromUrl: vi.fn(() => ({
    loading: false, error: null, downloadFromUrl: vi.fn().mockResolvedValue(true), resetError: vi.fn(),
  })),
}));

describe('useAddFileDialog', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('starts with dialog closed', () => {
    const { result } = renderHook(() => useAddFileDialog(null, vi.fn(), vi.fn()));
    expect(result.current.isOpen).toBe(false);
  });

  it('opens and closes dialog', () => {
    const { result } = renderHook(() => useAddFileDialog(null, vi.fn(), vi.fn()));
    act(() => { result.current.openDialog(); });
    expect(result.current.isOpen).toBe(true);
    act(() => { result.current.closeDialog(); });
    expect(result.current.isOpen).toBe(false);
  });

  it('exposes browse and url download handlers', () => {
    const { result } = renderHook(() => useAddFileDialog(null, vi.fn(), vi.fn()));
    expect(result.current.handleBrowseFiles).toBeDefined();
    expect(result.current.handleDownloadFromUrl).toBeDefined();
  });

  it('exposes url download state', () => {
    const { result } = renderHook(() => useAddFileDialog(null, vi.fn(), vi.fn()));
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.urlError).toBeNull();
    expect(result.current.resetUrlError).toBeDefined();
  });
});
