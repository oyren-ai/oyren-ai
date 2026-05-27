import { useEffect } from 'react';

type ShortcutHandlers = {
    [key: string]: (event: KeyboardEvent) => void;
};

/**
 * Attach multiple global keyboard shortcuts at once.
 * Example:
 * useKeyboardShortcuts({
 *   Escape: () => console.log("Escape pressed"),
 *   d: () => console.log("Pressed d"),
 * });
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
    useEffect(() => {
        const listener = (e: KeyboardEvent) => {
            const handler = handlers[e.key];
            if (handler) {
                handler(e);
            }
        };

        window.addEventListener('keydown', listener);
        return () => {
            window.removeEventListener('keydown', listener);
        };
    }, [handlers]);
}