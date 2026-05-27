/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotesPanel from '../NotesPanel.tsx';
import type { WorkspaceFile } from '@/types/workspace.ts';

// Mock contexts
vi.mock('@/contexts/NavigationContext', () => ({
    useViewNavigation: () => ({
        selectedWorkspace: { id: 'workspace-1', name: 'Test Workspace' }
    })
}));

vi.mock('@/contexts/ModalContext', () => ({
    useCreateNoteModal: () => ({
        isOpen: false,
        open: vi.fn(),
        close: vi.fn()
    })
}));

// Mock hooks
const mockFiles: WorkspaceFile[] = [
    {
        id: 'file-1',
        workspace_id: 'workspace-1',
        file_path: 'workspace-1/note-1/slides.md',
        file_name: 'slides.md',
        added_at: '2024-01-01',
        last_accessed_at: '2024-01-01',
        is_visible: true,
        is_read_only: false
    }
];

let mockSelectedFile: WorkspaceFile | null = null;

vi.mock('../hooks/useNotes', () => ({
    useNotes: () => ({
        files: mockFiles,
        isLoading: false,
        selectedFile: mockSelectedFile,
        setSelectedFile: (file: WorkspaceFile | null) => {
            mockSelectedFile = file;
        }
    })
}));

vi.mock('../hooks/useCreateMdxNote', () => ({
    useCreateMdxNote: () => ({
        createNote: vi.fn(),
        isCreating: false
    })
}));

vi.mock('../hooks/useCreateLatexNote', () => ({
    useCreateLatexNote: () => ({
        createLatexNote: vi.fn(),
        isCreating: false
    })
}));

// Mock components
vi.mock('../NotesList', () => ({
    default: ({ files, onSelect }: any) => (
        <div data-testid="notes-list">
            {files.map((file: WorkspaceFile) => (
                <button key={file.id} onClick={() => onSelect(file)}>
                    {file.file_name}
                </button>
            ))}
        </div>
    )
}));

vi.mock('../NoteDetailView', () => ({
    default: ({ note, onBack }: any) => (
        <div data-testid="note-detail-view">
            <button onClick={onBack}>Back</button>
            <span>{note.file_name}</span>
        </div>
    )
}));

vi.mock('../EmptyNotesState', () => ({
    default: () => <div data-testid="empty-state">No notes</div>
}));

vi.mock('../CreateNoteDialog', () => ({
    CreateNoteDialog: () => <div data-testid="create-note-dialog" />
}));

describe('NotesPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders create note button', () => {
        render(<NotesPanel />);

        const createButton = screen.getByRole('button', { name: /create note/i });
        expect(createButton).toBeInTheDocument();
    });

    it('shows notes list by default', () => {
        render(<NotesPanel />);

        expect(screen.getByTestId('notes-list')).toBeInTheDocument();
        expect(screen.queryByTestId('note-detail-view')).not.toBeInTheDocument();
    });

    it('renders notes list when files are available', () => {
        render(<NotesPanel />);

        expect(screen.getByTestId('notes-list')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /slides\.md/i })).toBeInTheDocument();
    });
});