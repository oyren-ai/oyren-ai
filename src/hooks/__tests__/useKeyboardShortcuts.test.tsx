/** @vitest-environment jsdom */
// src/hooks/__tests__/useKeyboardShortcuts.test.tsx
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

type MapProp = Record<string, (e: KeyboardEvent) => void>;

function TestComponent(props: { map: MapProp }) {
    useKeyboardShortcuts(props.map);
    return null; // no UI needed
}

function keyDown(key: string, init: Partial<KeyboardEventInit> = {}) {
    const evt = new KeyboardEvent('keydown', { key, bubbles: true, ...init });
    window.dispatchEvent(evt);
    return evt;
}

afterEach(() => cleanup());

describe('useKeyboardShortcuts', () => {
    it('calls the handler when the mapped key is pressed', () => {
        const onEsc = vi.fn();
        render(<TestComponent map={{ Escape: onEsc }} />);

        keyDown('Escape');

        expect(onEsc).toHaveBeenCalledTimes(1);
        expect(onEsc.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
    });

    it('does not call handler for other keys', () => {
        const onEsc = vi.fn();
        render(<TestComponent map={{ Escape: onEsc }} />);

        keyDown('Enter');
        keyDown('e');

        expect(onEsc).not.toHaveBeenCalled();
    });

    it('supports multiple mappings', () => {
        const onD = vi.fn();
        const onM = vi.fn();

        render(<TestComponent map={{ d: onD, m: onM }} />);

        keyDown('d');
        keyDown('m');

        expect(onD).toHaveBeenCalledTimes(1);
        expect(onM).toHaveBeenCalledTimes(1);
    });

    it('passes the original KeyboardEvent', () => {
        const onD = vi.fn();
        render(<TestComponent map={{ d: onD }} />);

        const evt = keyDown('d', { ctrlKey: true });

        expect(onD).toHaveBeenCalledWith(evt);
        expect((onD.mock.calls[0][0] as KeyboardEvent).ctrlKey).toBe(true);
    });

    it('cleans up on unmount', () => {
        const onEsc = vi.fn();
        const { unmount } = render(<TestComponent map={{ Escape: onEsc }} />);

        unmount();
        keyDown('Escape');

        expect(onEsc).not.toHaveBeenCalled();
    });

    it('updates when mapping changes (rerender)', () => {
        const oldFn = vi.fn();
        const newFn = vi.fn();

        const { rerender } = render(<TestComponent map={{ d: oldFn }} />);
        keyDown('d');
        expect(oldFn).toHaveBeenCalledTimes(1);

        rerender(<TestComponent map={{ d: newFn }} />);
        keyDown('d');

        expect(oldFn).toHaveBeenCalledTimes(1);
        expect(newFn).toHaveBeenCalledTimes(1);
    });
});