import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePromptEditor } from '../usePromptEditor';
import { workspacePromptApi } from '@/api/workspacePromptApi';
import type { WorkspacePrompt } from '@/types/workspacePrompt';

vi.mock('@/api/workspacePromptApi', () => ({
    workspacePromptApi: {
        create: vi.fn(),
        update: vi.fn(),
        list: vi.fn(),
        delete: vi.fn(),
        resolve: vi.fn(),
    },
}));

const mockPrompt: WorkspacePrompt = {
    id: 'p-1', workspace_id: 'ws', title: 'Test',
    blocks: '[{"type":"text","content":"hello"}]',
    created_at: '', updated_at: '',
};

describe('usePromptEditor', () => {
    it('starts new with empty state', () => {
        const { result } = renderHook(() => usePromptEditor('ws', vi.fn()));
        act(() => result.current.startNew());
        expect(result.current.title).toBe('');
        expect(result.current.blocks).toEqual([{ type: 'text', content: '' }]);
    });

    it('starts edit with existing prompt', () => {
        const { result } = renderHook(() => usePromptEditor('ws', vi.fn()));
        act(() => result.current.startEdit(mockPrompt));
        expect(result.current.title).toBe('Test');
        expect(result.current.blocks[0].content).toBe('hello');
    });

    it('creates new prompt on save', async () => {
        vi.mocked(workspacePromptApi.create).mockResolvedValue(mockPrompt);
        const onSaved = vi.fn();
        const { result } = renderHook(() => usePromptEditor('ws', onSaved));

        act(() => result.current.startNew());
        act(() => result.current.setTitle('New Title'));

        await act(async () => { await result.current.save(); });
        expect(workspacePromptApi.create).toHaveBeenCalled();
        expect(onSaved).toHaveBeenCalled();
    });

    it('updates existing prompt on save', async () => {
        vi.mocked(workspacePromptApi.update).mockResolvedValue(undefined);
        const onSaved = vi.fn();
        const { result } = renderHook(() => usePromptEditor('ws', onSaved));

        act(() => result.current.startEdit(mockPrompt));
        act(() => result.current.setTitle('Updated'));

        await act(async () => { await result.current.save(); });
        expect(workspacePromptApi.update).toHaveBeenCalledWith('p-1', 'Updated', expect.any(String));
    });
});
