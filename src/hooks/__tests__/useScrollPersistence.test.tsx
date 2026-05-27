import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';
import { useScrollPersistence } from '@/hooks/useScrollPersistence';
import { ScrollPersistenceProvider } from '@/contexts/ScrollPersistenceContext';
import type { ReactNode } from 'react';

// Wrapper with provider
function wrapper({ children }: { children: ReactNode }) {
    return <ScrollPersistenceProvider>{ children } </ScrollPersistenceProvider>;
}

describe('useScrollPersistence', () => {
    let mockScrollContainer: HTMLDivElement;

    beforeEach(() => {
        vi.clearAllMocks();

        // Create mock scrollable element
        mockScrollContainer = document.createElement('div');
        Object.defineProperties(mockScrollContainer, {
            scrollTop: {
                value: 0,
                writable: true,
                configurable: true,
            },
            scrollHeight: {
                value: 1000,
                writable: true,
                configurable: true,
            },
            clientHeight: {
                value: 500,
                writable: true,
                configurable: true,
            },
        });
    });

    it('does not throw when ref is null', () => {
        expect(() => {
            renderHook(
                () => {
                    const ref = useRef<HTMLDivElement>(null);
                    useScrollPersistence({
                        tabId: 'test-tab',
                        scrollContainerRef: ref,
                    });
                },
                { wrapper }
            );
        }).not.toThrow();
    });

    it('accepts valid ref without errors', () => {
        const { result } = renderHook(
            () => {
                const ref = useRef<HTMLDivElement>(mockScrollContainer);
                useScrollPersistence({
                    tabId: 'test-tab',
                    scrollContainerRef: ref,
                });
                return ref;
            },
            { wrapper }
        );

        expect(result.current.current).toBe(mockScrollContainer);
    });

    it('can be disabled via enabled prop', () => {
        const { result } = renderHook(
            () => {
                const ref = useRef<HTMLDivElement>(mockScrollContainer);
                useScrollPersistence({
                    tabId: 'test-tab',
                    scrollContainerRef: ref,
                    enabled: false,
                });
                return ref;
            },
            { wrapper }
        );

        expect(result.current.current).toBe(mockScrollContainer);
    });

    it('accepts custom debounce time', () => {
        const { result } = renderHook(
            () => {
                const ref = useRef<HTMLDivElement>(mockScrollContainer);
                useScrollPersistence({
                    tabId: 'test-tab',
                    scrollContainerRef: ref,
                    debounceMs: 200,
                });
                return ref;
            },
            { wrapper }
        );

        expect(result.current.current).toBe(mockScrollContainer);
    });

    it('handles unmount gracefully', () => {
        const { unmount } = renderHook(
            () => {
                const ref = useRef<HTMLDivElement>(mockScrollContainer);
                useScrollPersistence({
                    tabId: 'test-tab',
                    scrollContainerRef: ref,
                });
                return ref;
            },
            { wrapper }
        );

        expect(() => unmount()).not.toThrow();
    });

    it('works with different tab IDs', () => {
        const { result: result1 } = renderHook(
            () => {
                const ref = useRef<HTMLDivElement>(mockScrollContainer);
                useScrollPersistence({
                    tabId: 'tab-1',
                    scrollContainerRef: ref,
                });
                return ref;
            },
            { wrapper }
        );

        const { result: result2 } = renderHook(
            () => {
                const ref = useRef<HTMLDivElement>(mockScrollContainer);
                useScrollPersistence({
                    tabId: 'tab-2',
                    scrollContainerRef: ref,
                });
                return ref;
            },
            { wrapper }
        );

        expect(result1.current.current).toBe(mockScrollContainer);
        expect(result2.current.current).toBe(mockScrollContainer);
    });
});
