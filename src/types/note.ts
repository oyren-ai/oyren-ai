export type NoteType = 'MDX' | 'Slides' | 'Diagram';

export interface Note {
    id: string;
    name: string;
    type: NoteType;
    content: string;
    workspace_id: string;
    created_at: string;
    updated_at: string;
}