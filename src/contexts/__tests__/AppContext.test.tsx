import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AppProvider, useAppContext } from '../AppContext';

// Mock the hooks
vi.mock('../../hooks/useResizableSidebar', () => ({
  useResizableSidebar: () => ({
    sidebarWidth: 250,
    handleMouseDown: vi.fn(),
  }),
}));

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document state
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
  });

  it('should throw error when used outside provider', () => {
    const { result } = renderHook(() => {
      try {
        return useAppContext();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toBe('useAppContext must be used within AppProvider');
  });

  it('should provide default values', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: AppProvider,
    });

    expect(result.current.isDarkMode).toBe(true);
    expect(result.current.openPdfs).toEqual([]);
    expect(result.current.currentPdfPath).toBe(null);
    expect(result.current.isAiChatCollapsed).toBe(false);
    expect(result.current.isSidebarCollapsed).toBe(false);
  });

  it('should handle theme toggle', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: AppProvider,
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should handle PDF path changes', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: AppProvider,
    });

    act(() => {
      result.current.setCurrentPdfPath('/path/to/pdf.pdf');
    });

    expect(result.current.currentPdfPath).toBe('/path/to/pdf.pdf');
    expect(result.current.openPdfs).toHaveLength(1);
    expect(result.current.openPdfs[0].path).toBe('/path/to/pdf.pdf');
  });

  it('should close pdf tab and switch active tab', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: AppProvider,
    });

    act(() => {
      result.current.setCurrentPdfPath('/a.pdf');
      result.current.setCurrentPdfPath('/b.pdf');
    });

    expect(result.current.openPdfs).toHaveLength(2);
    expect(result.current.currentPdfPath).toBe('/b.pdf');

    act(() => {
      result.current.closePdfTab('/b.pdf');
    });

    expect(result.current.openPdfs).toHaveLength(1);
    expect(result.current.currentPdfPath).toBe('/a.pdf');

    act(() => {
      result.current.closePdfTab('/a.pdf');
    });

    expect(result.current.openPdfs).toHaveLength(0);
    expect(result.current.currentPdfPath).toBe(null);
  });

  it('should handle UI state changes', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: AppProvider,
    });

    act(() => {
      result.current.setIsAiChatCollapsed(true);
      result.current.setIsSidebarCollapsed(true);
    });

    expect(result.current.isAiChatCollapsed).toBe(true);
    expect(result.current.isSidebarCollapsed).toBe(true);
  });




  it('should handle pdf-loaded event', () => {
    renderHook(() => useAppContext(), {
      wrapper: AppProvider,
    });

    const event = new CustomEvent('pdf-loaded', {
      detail: { data: new Uint8Array([1, 2, 3]), filename: 'test.pdf' },
    });

    // Event listener is registered but handler is currently empty (no-op)
    // This test just verifies the event doesn't cause errors
    expect(() => {
      act(() => {
        window.dispatchEvent(event);
      });
    }).not.toThrow();
  });


  it('should provide sidebar width from hook', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: AppProvider,
    });

    expect(result.current.sidebarWidth).toBe(250);
    expect(result.current.handleMouseDown).toBeDefined();
  });

});
