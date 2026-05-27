import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { ScrollPersistenceProvider, useScrollPersistenceContext } from '../ScrollPersistenceContext';

// Wrapper component for testing
function wrapper({ children }: { children: ReactNode }) {
    return <ScrollPersistenceProvider>{children}</ScrollPersistenceProvider>;
}

describe('ScrollPersistenceContext', () => {
    it('throws error when used outside provider', () => {
        // Suppress console.error for this test
        const originalError = console.error;
        console.error = () => { };

        expect(() => {
            renderHook(() => useScrollPersistenceContext());
        }).toThrow('useScrollPersistenceContext must be used within ScrollPersistenceProvider');

        console.error = originalError;
    });

    it('returns initial scroll position as 0 for new tab', () => {
        const { result } = renderHook(() => useScrollPersistenceContext(), { wrapper });

        const scrollTop = result.current.getScrollPosition('tab-1');
        expect(scrollTop).toBe(0);
    });

    it('saves and retrieves scroll position for a tab', () => {
        const { result } = renderHook(() => useScrollPersistenceContext(), { wrapper });

        act(() => {
            result.current.setScrollPosition('tab-1', 150);
        });

        const scrollTop = result.current.getScrollPosition('tab-1');
        expect(scrollTop).toBe(150);
    });

    it('maintains separate scroll positions for different tabs', () => {
        const { result } = renderHook(() => useScrollPersistenceContext(), { wrapper });

        act(() => {
            result.current.setScrollPosition('tab-1', 100);
            result.current.setScrollPosition('tab-2', 200);
            result.current.setScrollPosition('tab-3', 300);
        });

        expect(result.current.getScrollPosition('tab-1')).toBe(100);
        expect(result.current.getScrollPosition('tab-2')).toBe(200);
        expect(result.current.getScrollPosition('tab-3')).toBe(300);
    });

    it('updates scroll position when called multiple times for same tab', () => {
        const { result } = renderHook(() => useScrollPersistenceContext(), { wrapper });

        act(() => {
            result.current.setScrollPosition('tab-1', 100);
        });

        expect(result.current.getScrollPosition('tab-1')).toBe(100);

        act(() => {
            result.current.setScrollPosition('tab-1', 250);
        });

        expect(result.current.getScrollPosition('tab-1')).toBe(250);
    });

    it('clears scroll position for a tab', () => {
        const { result } = renderHook(() => useScrollPersistenceContext(), { wrapper });

        act(() => {
            result.current.setScrollPosition('tab-1', 150);
        });

        expect(result.current.getScrollPosition('tab-1')).toBe(150);

        act(() => {
            result.current.clearScrollPosition('tab-1');
        });

        expect(result.current.getScrollPosition('tab-1')).toBe(0);
    });

    it('does not affect other tabs when clearing one tab', () => {
        const { result } = renderHook(() => useScrollPersistenceContext(), { wrapper });

        act(() => {
            result.current.setScrollPosition('tab-1', 100);
            result.current.setScrollPosition('tab-2', 200);
        });

        act(() => {
            result.current.clearScrollPosition('tab-1');
        });

        expect(result.current.getScrollPosition('tab-1')).toBe(0);
        expect(result.current.getScrollPosition('tab-2')).toBe(200);
    });

    it('handles clearing non-existent tab gracefully', () => {
        const { result } = renderHook(() => useScrollPersistenceContext(), { wrapper });

        expect(() => {
            act(() => {
                result.current.clearScrollPosition('non-existent-tab');
            });
        }).not.toThrow();

        expect(result.current.getScrollPosition('non-existent-tab')).toBe(0);
    });

    it('persists scroll positions across re-renders', () => {
        const { result, rerender } = renderHook(() => useScrollPersistenceContext(), { wrapper });

        act(() => {
            result.current.setScrollPosition('tab-1', 500);
        });

        rerender();

        expect(result.current.getScrollPosition('tab-1')).toBe(500);
    });
});
