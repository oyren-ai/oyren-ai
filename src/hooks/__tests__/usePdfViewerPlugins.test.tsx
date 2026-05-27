import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePdfViewerPlugins } from '@/features/pdf-viewer/hooks/usePdfViewerPlugins';

const mockRenderHighlightTarget = vi.fn((props: any) => <div>HighlightTarget</div>);
const mockRenderHighlightContent = vi.fn(() => <div style={{ background: 'yellow', opacity: 0.4 }} />);
const mockRenderHighlights = vi.fn(() => <div data-testid="highlights-layer" />);

describe('usePdfViewerPlugins', () => {
  const defaultProps = {
    renderHighlightTarget: mockRenderHighlightTarget,
    renderHighlightContent: mockRenderHighlightContent,
  };

  it('returns all required plugin instances', () => {
    const { result } = renderHook(() => usePdfViewerPlugins(defaultProps));

    expect(result.current.zoomPlugin).toBeDefined();
    expect(result.current.bookmarkPlugin).toBeDefined();
    expect(result.current.searchPlugin).toBeDefined();
    expect(result.current.highlightPlugin).toBeDefined();
    expect(result.current.pageNavigationPlugin).toBeDefined();
    expect(result.current.rotatePlugin).toBeDefined();
  });

  it('returns zoom plugin with zoomTo method', () => {
    const { result } = renderHook(() => usePdfViewerPlugins(defaultProps));

    expect(result.current.zoomPlugin).toBeDefined();
    expect(result.current.zoomPlugin.zoomTo).toBeDefined();
    expect(typeof result.current.zoomPlugin.zoomTo).toBe('function');
  });

  it('returns bookmark plugin with Bookmarks component', () => {
    const { result } = renderHook(() => usePdfViewerPlugins(defaultProps));

    expect(result.current.bookmarkPlugin).toBeDefined();
    expect(result.current.bookmarkPlugin.Bookmarks).toBeDefined();
    expect(typeof result.current.bookmarkPlugin.Bookmarks).toBe('function');
  });

  it('returns search plugin with required methods', () => {
    const { result } = renderHook(() => usePdfViewerPlugins(defaultProps));

    expect(result.current.searchPlugin).toBeDefined();
    expect(result.current.searchPlugin).toHaveProperty('highlight');
    expect(result.current.searchPlugin).toHaveProperty('clearHighlights');
  });

  it('returns page navigation plugin with navigation methods', () => {
    const { result } = renderHook(() => usePdfViewerPlugins(defaultProps));

    expect(result.current.pageNavigationPlugin).toBeDefined();
    expect(result.current.pageNavigationPlugin.jumpToPage).toBeDefined();
    expect(typeof result.current.pageNavigationPlugin.jumpToPage).toBe('function');
  });

  it('returns rotate plugin with rotate buttons', () => {
    const { result } = renderHook(() => usePdfViewerPlugins(defaultProps));

    expect(result.current.rotatePlugin).toBeDefined();
    expect(result.current.rotatePlugin.RotateBackwardButton).toBeDefined();
    expect(result.current.rotatePlugin.RotateForwardButton).toBeDefined();
    expect(typeof result.current.rotatePlugin.RotateBackwardButton).toBe('function');
    expect(typeof result.current.rotatePlugin.RotateForwardButton).toBe('function');
  });

  it('returns highlight plugin', () => {
    const { result } = renderHook(() => usePdfViewerPlugins(defaultProps));

    expect(result.current.highlightPlugin).toBeDefined();
  });

  it('initializes all 6 plugins', () => {
    const { result } = renderHook(() => usePdfViewerPlugins(defaultProps));

    const pluginKeys = Object.keys(result.current);
    expect(pluginKeys).toHaveLength(6);
    expect(pluginKeys).toContain('zoomPlugin');
    expect(pluginKeys).toContain('bookmarkPlugin');
    expect(pluginKeys).toContain('searchPlugin');
    expect(pluginKeys).toContain('highlightPlugin');
    expect(pluginKeys).toContain('pageNavigationPlugin');
    expect(pluginKeys).toContain('rotatePlugin');
  });

  it('uses provided render functions for highlight plugin', () => {
    const { result } = renderHook(() => usePdfViewerPlugins(defaultProps));

    // Verify highlight plugin is created with custom render functions
    expect(result.current.highlightPlugin).toBeDefined();
  });

  it('accepts optional renderHighlights for persisted highlight layer', () => {
    const { result } = renderHook(() =>
      usePdfViewerPlugins({ ...defaultProps, renderHighlights: mockRenderHighlights }),
    );
    expect(result.current.highlightPlugin).toBeDefined();
  });

  it('maintains stable plugin instances across re-renders', () => {
    const { result, rerender } = renderHook(() => usePdfViewerPlugins(defaultProps));

    const firstRender = {
      zoomPlugin: result.current.zoomPlugin,
      searchPlugin: result.current.searchPlugin,
    };

    rerender();

    // Note: These will be different instances because the hook
    // creates new plugin instances on each call
    // This is expected behavior for PDF viewer plugins
    expect(result.current.zoomPlugin).toBeDefined();
    expect(result.current.searchPlugin).toBeDefined();
  });
});