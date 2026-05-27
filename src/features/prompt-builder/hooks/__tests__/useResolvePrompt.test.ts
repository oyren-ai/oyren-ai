import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useResolvePrompt } from '../useResolvePrompt';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { workspacePromptApi } from '@/api/workspacePromptApi';

vi.mock('@/api/workspacePromptApi', () => ({
    workspacePromptApi: {
        resolve: vi.fn(),
    },
}));

describe('useResolvePrompt', () => {
    it('resolves and copies to clipboard', async () => {
        vi.mocked(workspacePromptApi.resolve).mockResolvedValue('resolved text');
        vi.useFakeTimers();

        const { result } = renderHook(() => useResolvePrompt());

        await act(async () => {
            await result.current.resolveAndCopy('p-1');
        });

        expect(workspacePromptApi.resolve).toHaveBeenCalledWith('p-1');
        expect(writeText).toHaveBeenCalledWith('resolved text');
        expect(result.current.resolved).toBe(true);

        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.resolved).toBe(false);

        vi.useRealTimers();
    });

    it('handles error gracefully', async () => {
        vi.mocked(workspacePromptApi.resolve).mockRejectedValue(new Error('fail'));
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useResolvePrompt());

        await act(async () => {
            await result.current.resolveAndCopy('p-1');
        });

        expect(result.current.isResolving).toBe(false);
        expect(result.current.resolved).toBe(false);
        spy.mockRestore();
    });
});
