import { useState, useEffect, useCallback } from 'react';
import { notesApi } from '@/api/notesApi';
import type { Note, NoteType } from '@/types/note';

export function useNotes(workspaceId: string, noteType?: NoteType) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await notesApi.listNotes(workspaceId, noteType);
            setNotes(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notes';
            setError(errorMessage);
            console.error('Error fetching notes:', err);
            setNotes([]);
        } finally {
            setIsLoading(false);
        }
    }, [workspaceId, noteType]);

    useEffect(() => {
        void fetchNotes();
    }, [fetchNotes]);

    const refreshNotes = useCallback(async () => {
        await fetchNotes();
    }, [fetchNotes]);

    return {
        notes,
        isLoading,
        error,
        refreshNotes
    };
}