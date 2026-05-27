import { describe, it, expect } from 'vitest';
import { notesApi } from '../notesApi';

describe('notesApi', () => {
    describe('listNotes', () => {
        it('should return notes for workspace-1', async () => {
            const result = await notesApi.listNotes('workspace-1');

            expect(result).toHaveLength(4);
            expect(result.every(note => note.workspace_id === 'workspace-1')).toBe(true);
        });

        it('should return empty array for non-existent workspace', async () => {
            const result = await notesApi.listNotes('non-existent');

            expect(result).toHaveLength(0);
        });

        it('should filter by MDX note type', async () => {
            const result = await notesApi.listNotes('workspace-1', 'MDX');

            expect(result).toHaveLength(2);
            expect(result.every(note => note.type === 'MDX')).toBe(true);
        });

        it('should filter by Slides note type', async () => {
            const result = await notesApi.listNotes('workspace-1', 'Slides');

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('Slides');
            expect(result[0].name).toBe('Presentation');
        });

        it('should filter by Diagram note type', async () => {
            const result = await notesApi.listNotes('workspace-1', 'Diagram');

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('Diagram');
            expect(result[0].name).toBe('Architecture');
        });

        it('should return notes with full metadata', async () => {
            const result = await notesApi.listNotes('workspace-1');
            const note = result[0];

            expect(note.id).toBeTruthy();
            expect(note.name).toBeTruthy();
            expect(note.type).toBeTruthy();
            expect(note.content).toBeTruthy();
            expect(note.workspace_id).toBe('workspace-1');
            expect(note.created_at).toBeTruthy();
            expect(note.updated_at).toBeTruthy();
        });
    });

    describe('readNote', () => {
        it('should return specific note by id', async () => {
            const result = await notesApi.readNote('mdx-1');

            expect(result.id).toBe('mdx-1');
            expect(result.name).toBe('Getting Started');
            expect(result.type).toBe('MDX');
            expect(result.content).toContain('Welcome to your first MDX note');
        });

        it('should return note with full metadata', async () => {
            const result = await notesApi.readNote('slides-1');

            expect(result.id).toBe('slides-1');
            expect(result.name).toBe('Presentation');
            expect(result.type).toBe('Slides');
            expect(result.content).toBeTruthy();
            expect(result.workspace_id).toBe('workspace-1');
            expect(result.created_at).toBeTruthy();
            expect(result.updated_at).toBeTruthy();
        });

        it('should throw error for non-existent note', async () => {
            await expect(notesApi.readNote('non-existent')).rejects.toThrow('not found');
        });
    });
});