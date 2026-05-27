import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useBlockOperations } from '../useBlockOperations';
import type { PromptBlock } from '@/types/workspacePrompt';

describe('useBlockOperations', () => {
    const makeBlocks = (): PromptBlock[] => [
        { type: 'text', content: 'A' },
        { type: 'file', fileId: '1', fileName: 'f.pdf' },
        { type: 'text', content: 'B' },
    ];

    it('adds a text block', () => {
        const setBlocks = vi.fn();
        const { result } = renderHook(() => useBlockOperations([{ type: 'text', content: 'X' }], setBlocks));
        act(() => result.current.addTextBlock());
        expect(setBlocks).toHaveBeenCalledWith([
            { type: 'text', content: 'X' },
            { type: 'text', content: '' },
        ]);
    });

    it('adds a file block', () => {
        const setBlocks = vi.fn();
        const { result } = renderHook(() => useBlockOperations([], setBlocks));
        act(() => result.current.addFileBlock('id-1', 'file.pdf'));
        expect(setBlocks).toHaveBeenCalledWith([{ type: 'file', fileId: 'id-1', fileName: 'file.pdf' }]);
    });

    it('removes a block', () => {
        const blocks = makeBlocks();
        const setBlocks = vi.fn();
        const { result } = renderHook(() => useBlockOperations(blocks, setBlocks));
        act(() => result.current.removeBlock(1));
        expect(setBlocks).toHaveBeenCalledWith([blocks[0], blocks[2]]);
    });

    it('moves block up', () => {
        const blocks = makeBlocks();
        const setBlocks = vi.fn();
        const { result } = renderHook(() => useBlockOperations(blocks, setBlocks));
        act(() => result.current.moveBlockUp(1));
        const call = setBlocks.mock.calls[0][0];
        expect(call[0].fileId).toBe('1');
        expect(call[1].content).toBe('A');
    });

    it('moves block down', () => {
        const blocks = makeBlocks();
        const setBlocks = vi.fn();
        const { result } = renderHook(() => useBlockOperations(blocks, setBlocks));
        act(() => result.current.moveBlockDown(0));
        const call = setBlocks.mock.calls[0][0];
        expect(call[0].fileId).toBe('1');
        expect(call[1].content).toBe('A');
    });

    it('does not move first block up', () => {
        const setBlocks = vi.fn();
        const { result } = renderHook(() => useBlockOperations(makeBlocks(), setBlocks));
        act(() => result.current.moveBlockUp(0));
        expect(setBlocks).not.toHaveBeenCalled();
    });

    it('does not move last block down', () => {
        const blocks = makeBlocks();
        const setBlocks = vi.fn();
        const { result } = renderHook(() => useBlockOperations(blocks, setBlocks));
        act(() => result.current.moveBlockDown(2));
        expect(setBlocks).not.toHaveBeenCalled();
    });
});
