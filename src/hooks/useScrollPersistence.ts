import { useEffect, useLayoutEffect, useRef, RefObject } from 'react';
import { useScrollPersistenceContext } from '@/contexts/ScrollPersistenceContext';

interface UseScrollPersistenceOptions {
    tabId: string;
    scrollContainerRef: RefObject<HTMLElement>;
    enabled?: boolean;
    debounceMs?: number;
}

/**
 * VS Code style scroll persistence hook
 * Automatically saves and restores scroll position for a given tab
 * 
 * IMPORTANT: This hook automatically finds the actual scrollable element
 * within the provided container ref, since PDF.js creates its own internal scroll container
 */
export function useScrollPersistence({
    tabId,
    scrollContainerRef,
    enabled = true,
    debounceMs = 100
}: UseScrollPersistenceOptions) {
    const { getScrollPosition, setScrollPosition } = useScrollPersistenceContext();
    const scrollTimeoutRef = useRef<NodeJS.Timeout>();
    const isRestoringRef = useRef(false);
    const rafIdRef = useRef<number>();
    const actualScrollContainerRef = useRef<HTMLElement | null>(null);

    // Find the actual scrollable element within the container
    const findScrollableElement = (container: HTMLElement): HTMLElement | null => {
        // First check if the container itself is scrollable
        if (container.scrollHeight > container.clientHeight) {
            return container;
        }

        // Otherwise, search for a scrollable child
        const allElements = container.querySelectorAll('*');
        for (const el of Array.from(allElements)) {
            const element = el as HTMLElement;
            if (element.scrollHeight > element.clientHeight) {
                return element;
            }
        }

        return null;
    };

    // Restore scroll position on mount using useLayoutEffect to prevent jitter
    useLayoutEffect(() => {
        if (!enabled || !scrollContainerRef.current) return;

        const wrapper = scrollContainerRef.current;

        // Find the actual scrollable element
        const findAndRestore = () => {
            const scrollable = findScrollableElement(wrapper);

            if (!scrollable) {
                rafIdRef.current = requestAnimationFrame(findAndRestore);
                return;
            }

            actualScrollContainerRef.current = scrollable;

            const savedScrollTop = getScrollPosition(tabId);

            if (savedScrollTop <= 0) {
                isRestoringRef.current = false;
                return;
            }

            isRestoringRef.current = true;

            // Restore scroll position
            const restore = () => {
                if (!scrollable) return;

                if (scrollable.scrollHeight > scrollable.clientHeight) {
                    scrollable.scrollTop = savedScrollTop;

                    requestAnimationFrame(() => {
                        isRestoringRef.current = false;
                    });
                } else {
                    rafIdRef.current = requestAnimationFrame(restore);
                }
            };

            rafIdRef.current = requestAnimationFrame(restore);
        };

        findAndRestore();

        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, [tabId, enabled, getScrollPosition]);

    // Listen for scroll events and save position (debounced)
    useEffect(() => {
        if (!enabled || !scrollContainerRef.current) return;

        const wrapper = scrollContainerRef.current;
        let scrollable: HTMLElement | null = null;

        // Wait for scrollable element to be available
        const setupScrollListener = () => {
            scrollable = actualScrollContainerRef.current || findScrollableElement(wrapper);

            if (!scrollable) {
                setTimeout(setupScrollListener, 100);
                return;
            }


            const handleScroll = () => {
                if (!scrollable) return;

                if (isRestoringRef.current) {
                    return;
                }

                clearTimeout(scrollTimeoutRef.current);
                scrollTimeoutRef.current = setTimeout(() => {
                    if (!isRestoringRef.current && scrollable) {
                        setScrollPosition(tabId, scrollable.scrollTop);
                    }
                }, debounceMs);
            };

            scrollable.addEventListener('scroll', handleScroll, { passive: true });

            return () => {
                if (scrollable) {
                    scrollable.removeEventListener('scroll', handleScroll);
                }
                clearTimeout(scrollTimeoutRef.current);
            };
        };

        const cleanup = setupScrollListener();

        return () => {
            if (cleanup) cleanup();
        };
    }, [tabId, enabled, debounceMs, setScrollPosition]);

    // Cleanup on unmount   
    useEffect(() => {
        return () => {
            clearTimeout(scrollTimeoutRef.current);
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);
}
