/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup, waitFor } from '@testing-library/react';
import { usePdfSearch } from '../usePdfSearch';

// Mock useKeyboardShortcuts
vi.mock('@/hooks/useKeyboardShortcuts', () => ({
    useKeyboardShortcuts: (map: Record<string, (e: KeyboardEvent) => void>) => {
        // Store the handler for testing
        (global as any).__keyboardShortcutHandlers = map;
    }
}));

function keyDown(key: string, init: Partial<KeyboardEventInit> = {}) {
    const evt = new KeyboardEvent('keydown', { key, bubbles: true, ...init });
    window.dispatchEvent(evt);
    return evt;
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('usePdfSearch', () => {
    const mockJumpToMatch = vi.fn();
    const mockHighlight = vi.fn();
    const mockClearHighlights = vi.fn();

    const mockSearchPluginInstance = {
        highlight: mockHighlight,
        clearHighlights: mockClearHighlights,
        jumpToMatch: mockJumpToMatch
    };

    beforeEach(() => {
        mockHighlight.mockResolvedValue([{ pageIndex: 0 }, { pageIndex: 1 }]);
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => usePdfSearch({ searchPluginInstance: mockSearchPluginInstance }));

        expect(result.current.showSearch).toBe(false);
        expect(result.current.searchKeyword).toBe('');
        expect(result.current.currentMatchIndex).toBe(0);
        expect(result.current.totalMatches).toBe(0);
    });

    it('toggles search visibility', () => {
        const { result } = renderHook(() => usePdfSearch({ searchPluginInstance: mockSearchPluginInstance }));

        act(() => {
            result.current.handleToggleSearch();
        });

        expect(result.current.showSearch).toBe(true);

        act(() => {
            result.current.handleToggleSearch();
        });

        expect(result.current.showSearch).toBe(false);
    });

    it('updates search keyword', () => {
        const { result } = renderHook(() => usePdfSearch({ searchPluginInstance: mockSearchPluginInstance }));

        act(() => {
            result.current.setSearchKeyword('test keyword');
        });

        expect(result.current.searchKeyword).toBe('test keyword');
    });

    it('handles search with Ctrl+F keyboard shortcut', () => {
        const { result } = renderHook(() => usePdfSearch({ searchPluginInstance: mockSearchPluginInstance }));

        expect(result.current.showSearch).toBe(false);

        // Trigger Ctrl+F
        const handlers = (global as any).__keyboardShortcutHandlers;
        const mockEvent = { ctrlKey: true, metaKey: false, preventDefault: vi.fn() } as any;

        act(() => {
            handlers.f(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(result.current.showSearch).toBe(true);
    });

    it('handles search with Cmd+F keyboard shortcut', () => {
        const { result } = renderHook(() => usePdfSearch({ searchPluginInstance: mockSearchPluginInstance }));

        expect(result.current.showSearch).toBe(false);

        // Trigger Cmd+F
        const handlers = (global as any).__keyboardShortcutHandlers;
        const mockEvent = { ctrlKey: false, metaKey: true, preventDefault: vi.fn() } as any;

        act(() => {
            handlers.f(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(result.current.showSearch).toBe(true);
    });

    it('does not trigger search with f key alone', () => {
        const { result } = renderHook(() => usePdfSearch({ searchPluginInstance: mockSearchPluginInstance }));

        const handlers = (global as any).__keyboardShortcutHandlers;
        const mockEvent = { ctrlKey: false, metaKey: false, preventDefault: vi.fn() } as any;

        act(() => {
            handlers.f(mockEvent);
        });

        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        expect(result.current.showSearch).toBe(false);
    });

    it('handles search when keyword is provided', async () => {
        const { result } = renderHook(() => usePdfSearch({ searchPluginInstance: mockSearchPluginInstance }));

        // setState is async — handleSearch must run after keyword is committed
        act(() => {
            result.current.setSearchKeyword('test');
        });
        act(() => {
            result.current.handleSearch();
        });

        await waitFor(() => {
            expect(mockClearHighlights).toHaveBeenCalled();
            expect(mockHighlight).toHaveBeenCalled();
            const arg = mockHighlight.mock.calls[0][0];
            expect(arg).toBeInstanceOf(RegExp);
            expect((arg as RegExp).test('test')).toBe(true);
        });
    });

    it('clears search and resets state', () => {
        const { result } = renderHook(() => usePdfSearch({ searchPluginInstance: mockSearchPluginInstance }));

        act(() => {
            result.current.setSearchKeyword('test');
            result.current.handleToggleSearch();
        });

        expect(result.current.showSearch).toBe(true);
        expect(result.current.searchKeyword).toBe('test');

        act(() => {
            result.current.handleClearSearch();
        });

        expect(result.current.showSearch).toBe(false);
        expect(result.current.searchKeyword).toBe('');
        expect(result.current.currentMatchIndex).toBe(0);
        expect(result.current.totalMatches).toBe(0);
    });

    it('navigates to next match', async () => {
        const { result } = renderHook(() => usePdfSearch({ searchPluginInstance: mockSearchPluginInstance }));

        // Trigger search to get matches
        act(() => {
            result.current.setSearchKeyword('test');
        });

        const event = new CustomEvent('pdf-search', { detail: { keyword: 'test' } });
        window.dispatchEvent(event);

        await waitFor(() => {
            expect(result.current.totalMatches).toBe(2);
        });

        act(() => {
            result.current.handleNextMatch();
        });

        expect(mockJumpToMatch).toHaveBeenCalledWith(2);
        expect(result.current.currentMatchIndex).toBe(1);
    });

    it('wraps to first match when at end', async () => {
        const { result } = renderHook(() => usePdfSearch({ searchPluginInstance: mockSearchPluginInstance }));

        const event = new CustomEvent('pdf-search', { detail: { keyword: 'test' } });
        window.dispatchEvent(event);

        await waitFor(() => {
            expect(result.current.totalMatches).toBe(2);
        });

        // First next - go to index 1
        act(() => {
            result.current.handleNextMatch();
        });

        expect(result.current.currentMatchIndex).toBe(1);

        // Second next - should wrap to index 0
        act(() => {
            result.current.handleNextMatch();
        });

        expect(result.current.currentMatchIndex).toBe(0);
        expect(mockJumpToMatch).toHaveBeenLastCalledWith(1);
    });

    it('navigates to previous match', async () => {
        const { result } = renderHook(() => usePdfSearch({ searchPluginInstance: mockSearchPluginInstance }));

        const event = new CustomEvent('pdf-search', { detail: { keyword: 'test' } });
        window.dispatchEvent(event);

        await waitFor(() => {
            expect(result.current.totalMatches).toBe(2);
        });

        act(() => {
            result.current.handlePreviousMatch();
        });

        expect(result.current.currentMatchIndex).toBe(1);
        expect(mockJumpToMatch).toHaveBeenCalledWith(2);
    });
});