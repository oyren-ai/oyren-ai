import { useCallback } from 'react';
import type { PromptBlock } from '@/types/workspacePrompt';

export function useBlockOperations(
    blocks: PromptBlock[],
    setBlocks: (blocks: PromptBlock[]) => void,
) {
    const addTextBlock = useCallback(() => {
        setBlocks([...blocks, { type: 'text', content: '' }]);
    }, [blocks, setBlocks]);

    const addFileBlock = useCallback((fileId: string, fileName: string) => {
        setBlocks([...blocks, { type: 'file', fileId, fileName }]);
    }, [blocks, setBlocks]);

    const removeBlock = useCallback((index: number) => {
        setBlocks(blocks.filter((_, i) => i !== index));
    }, [blocks, setBlocks]);

    const updateBlock = useCallback((index: number, updated: PromptBlock) => {
        const next = [...blocks];
        next[index] = updated;
        setBlocks(next);
    }, [blocks, setBlocks]);

    const moveBlockUp = useCallback((index: number) => {
        if (index <= 0) return;
        const next = [...blocks];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        setBlocks(next);
    }, [blocks, setBlocks]);

    const moveBlockDown = useCallback((index: number) => {
        if (index >= blocks.length - 1) return;
        const next = [...blocks];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        setBlocks(next);
    }, [blocks, setBlocks]);

    return { addTextBlock, addFileBlock, removeBlock, updateBlock, moveBlockUp, moveBlockDown };
}