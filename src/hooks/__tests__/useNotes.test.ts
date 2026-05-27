import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotes } from '@/features/notes/useNotes';
import * as notesApiModule from '@/api/notesApi';
import type { Note } from '@/types/note';

vi.mock('@/api/notesApi', () => ({
    notesApi: {
        listNotes: vi.fn(),
        readNote: vi.fn(),
        updateNote: vi.fn()
    }
}));

describe('useNotes', () => {
    const mockNotes: Note[] = [
        {
            id: 'mdx-1',
            name: 'Test Note',
            type: 'MDX',
            content: '# Test',
            workspace_id: 'workspace-1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch notes on mount', async () => {
        vi.mocked(notesApiModule.notesApi.listNotes).mockResolvedValue(mockNotes);

        const { result } = renderHook(() => useNotes('workspace-1', 'MDX'));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.notes).toEqual(mockNotes);
        expect(notesApiModule.notesApi.listNotes).toHaveBeenCalledWith('workspace-1', 'MDX');
    });

    it('should handle errors', async () => {
        const error = new Error('Failed to fetch');
        vi.mocked(notesApiModule.notesApi.listNotes).mockRejectedValue(error);

        const { result } = renderHook(() => useNotes('workspace-1'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Failed to fetch');
        expect(result.current.notes).toEqual([]);
    });

    it('should allow manual refresh', async () => {
        vi.mocked(notesApiModule.notesApi.listNotes).mockResolvedValue(mockNotes);

        const { result } = renderHook(() => useNotes('workspace-1'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(notesApiModule.notesApi.listNotes).toHaveBeenCalledTimes(1);

        await result.current.refreshNotes();

        expect(notesApiModule.notesApi.listNotes).toHaveBeenCalledTimes(2);
    });

    it('should refetch when workspace_id changes', async () => {
        vi.mocked(notesApiModule.notesApi.listNotes).mockResolvedValue(mockNotes);

        const { rerender } = renderHook(
            ({ workspaceId }) => useNotes(workspaceId),
            { initialProps: { workspaceId: 'workspace-1' } }
        );

        await waitFor(() => {
            expect(notesApiModule.notesApi.listNotes).toHaveBeenCalledWith('workspace-1', undefined);
        });

        rerender({ workspaceId: 'workspace-2' });

        await waitFor(() => {
            expect(notesApiModule.notesApi.listNotes).toHaveBeenCalledWith('workspace-2', undefined);
        });

        expect(notesApiModule.notesApi.listNotes).toHaveBeenCalledTimes(2);
    });
});