import { invoke } from '@tauri-apps/api/core';
import type { Note, NoteType } from '@/types/note';

// Hardcoded mock data for development
const MOCK_NOTES: Note[] = [
    {
        id: 'mdx-1',
        name: 'Getting Started',
        type: 'MDX',
        content: '# Getting Started\n\nWelcome to your first MDX note!',
        workspace_id: 'workspace-1',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
    },
    {
        id: 'mdx-2',
        name: 'Project Notes',
        type: 'MDX',
        content: '# Project Notes\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2',
        workspace_id: 'workspace-1',
        created_at: '2024-01-02T10:00:00Z',
        updated_at: '2024-01-02T10:00:00Z'
    },
    {
        id: 'slides-1',
        name: 'Presentation',
        type: 'Slides',
        content: '---\ntheme: default\nlayout: cover\n---\n\n# My Presentation',
        workspace_id: 'workspace-1',
        created_at: '2024-01-03T10:00:00Z',
        updated_at: '2024-01-03T10:00:00Z'
    },
    {
        id: 'diagram-1',
        name: 'Architecture',
        type: 'Diagram',
        content: 'graph TD;\n    A-->B;\n    A-->C;\n    B-->D;\n    C-->D;',
        workspace_id: 'workspace-1',
        created_at: '2024-01-04T10:00:00Z',
        updated_at: '2024-01-04T10:00:00Z'
    }
];

export const notesApi = {
    listNotes: async (
        workspaceId: string,
        noteType?: NoteType
    ): Promise<Note[]> => {
        // For now, return hardcoded data instead of calling invoke
        // TODO: Replace with real invoke call when backend is ready
        // return await invoke('list_notes', { workspaceId, noteType });

        await new Promise(resolve => setTimeout(resolve, 100));

        let filtered = MOCK_NOTES.filter(note => note.workspace_id === workspaceId);

        if (noteType) {
            filtered = filtered.filter(note => note.type === noteType);
        }

        return filtered;
    },

    readNote: async (noteId: string): Promise<Note> => {
        // For now, return hardcoded data instead of calling invoke
        // TODO: Replace with real invoke call when backend is ready
        // return await invoke('read_note', { noteId });

        await new Promise(resolve => setTimeout(resolve, 50));

        const note = MOCK_NOTES.find(n => n.id === noteId);

        if (!note) {
            throw new Error(`Note with id ${noteId} not found`);
        }

        return note;
    },

    updateNote: async (noteId: string, content: string): Promise<void> => {
        // For now, just simulate update with delay
        // TODO: Replace with real invoke call when backend is ready
        // return await invoke('update_note', { noteId, content });

        await new Promise(resolve => setTimeout(resolve, 50));

        const noteIndex = MOCK_NOTES.findIndex(n => n.id === noteId);

        if (noteIndex === -1) {
            throw new Error(`Note with id ${noteId} not found`);
        }

        // Update the mock note
        MOCK_NOTES[noteIndex] = {
            ...MOCK_NOTES[noteIndex],
            content,
            updated_at: new Date().toISOString()
        };
    }
};