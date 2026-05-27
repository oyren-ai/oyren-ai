import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePromptList } from '../usePromptList';
import { workspacePromptApi } from '@/api/workspacePromptApi';

vi.mock('@/api/workspacePromptApi', () => ({
    workspacePromptApi: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        resolve: vi.fn(),
    },
}));

describe('usePromptList', () => {
    it('loads prompts on mount', async () => {
        const mockPrompts = [{ id: '1', title: 'P1', workspace_id: 'ws', blocks: '[]', created_at: '', updated_at: '' }];
        vi.mocked(workspacePromptApi.list).mockResolvedValue(mockPrompts);

        const { result } = renderHook(() => usePromptList('ws'));

        await waitFor(() => {
            expect(result.current.prompts).toEqual(mockPrompts);
        });
        expect(workspacePromptApi.list).toHaveBeenCalledWith('ws');
    });

    it('does not load if workspaceId is undefined', () => {
        renderHook(() => usePromptList(undefined));
        expect(workspacePromptApi.list).not.toHaveBeenCalled();
    });

    it('handles API error gracefully', async () => {
        vi.mocked(workspacePromptApi.list).mockRejectedValue(new Error('fail'));
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => usePromptList('ws'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.prompts).toEqual([]);
        spy.mockRestore();
    });
});
