import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNoteDetail } from '@/features/notes/useNoteDetail';
import * as notesApi from '@/api/notesApi';
import type { Note } from '@/types/note';

vi.mock('@/api/notesApi', () => ({
    notesApi: {
        readNote: vi.fn(),
        updateNote: vi.fn(),
        listNotes: vi.fn()
    }
}));

describe('useNoteDetail', () => {
    const mockNote: Note = {
        id: 'note-1',
        name: 'Test Note',
        type: 'MDX',
        content: '# Test Content',
        workspace_id: 'workspace-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should load note content on mount', async () => {
        vi.mocked(notesApi.notesApi.readNote).mockResolvedValue(mockNote);

        const { result } = renderHook(() => useNoteDetail('note-1'));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.content).toBe('# Test Content');
        expect(notesApi.notesApi.readNote).toHaveBeenCalledWith('note-1');
    });

    it('should handle loading errors', async () => {
        const error = new Error('Failed to load note');
        vi.mocked(notesApi.notesApi.readNote).mockRejectedValue(error);

        const { result } = renderHook(() => useNoteDetail('note-1'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Failed to load note');
        expect(result.current.content).toBe('');
    });

    it('should return empty state when noteId is null', () => {
        const { result } = renderHook(() => useNoteDetail(null));

        expect(result.current.content).toBe('');
        expect(result.current.isLoading).toBe(false);
        expect(notesApi.notesApi.readNote).not.toHaveBeenCalled();
    });

    it('should update content immediately', async () => {
        vi.mocked(notesApi.notesApi.readNote).mockResolvedValue(mockNote);

        const { result } = renderHook(() => useNoteDetail('note-1'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.setContent('New content');
        });

        expect(result.current.content).toBe('New content');
    });

    it('should save content after debounce', async () => {
        vi.mocked(notesApi.notesApi.readNote).mockResolvedValue(mockNote);
        vi.mocked(notesApi.notesApi.updateNote).mockResolvedValue(undefined);

        const { result } = renderHook(() => useNoteDetail('note-1'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        act(() => {
            result.current.setContent('Updated content');
        });

        // Should not save immediately
        expect(notesApi.notesApi.updateNote).not.toHaveBeenCalled();

        // Wait for debounce (1 second) + a bit more
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Should have saved after debounce
        expect(notesApi.notesApi.updateNote).toHaveBeenCalledWith('note-1', 'Updated content');
    });
});
