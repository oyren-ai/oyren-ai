/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteDetailView from '../NoteDetailView.tsx';
import type { WorkspaceFile } from '@/types/workspace.ts';

const mockNote: WorkspaceFile = {
    id: 'file-1',
    workspace_id: 'workspace-1',
    file_path: 'workspace-1/my-note/slides.md',
    file_name: 'slides.md',
    added_at: '2024-01-01',
    last_accessed_at: '2024-01-01',
    is_visible: true,
    is_read_only: false
};

// Mock the hook
type UseNoteDetailReturn = {
    content: string;
    setContent: (c: string) => void;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
};

const mockUseNoteDetail = vi.fn<() => UseNoteDetailReturn>(() => ({
    content: '# Test Content',
    setContent: vi.fn(),
    isLoading: false,
    isSaving: false,
    error: null
}));

vi.mock('../hooks/useNoteDetail', () => ({
    useNoteDetail: () => mockUseNoteDetail()
}));

// Mock components
vi.mock('../NoteNavbar', () => ({
    default: ({ title, isEditing, onBack, onToggleEdit }: any) => (
        <div data-testid="note-navbar">
            <button onClick={onBack}>Back</button>
            <span>{title}</span>
            <button onClick={onToggleEdit}>{isEditing ? 'Preview' : 'Edit'}</button>
        </div>
    )
}));

vi.mock('../MarkdownViewer', () => ({
    default: ({ content, isLoading }: any) => (
        <div data-testid="markdown-viewer">
            {isLoading ? 'Loading...' : content}
        </div>
    )
}));

vi.mock('../NoteEditor', () => ({
    default: ({ content, onChange }: any) => (
        <div data-testid="note-editor">
            <textarea value={content} onChange={(e) => onChange(e.target.value)} />
        </div>
    )
}));

describe('NoteDetailView', () => {
    const mockOnBack = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders note navbar and markdown viewer', () => {
        render(<NoteDetailView note={mockNote} onBack={mockOnBack} />);

        expect(screen.getByTestId('note-navbar')).toBeInTheDocument();
        expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument();
    });

    it('displays note name extracted from path', () => {
        render(<NoteDetailView note={mockNote} onBack={mockOnBack} />);

        expect(screen.getByText('my-note')).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', async () => {
        const user = userEvent.setup();
        render(<NoteDetailView note={mockNote} onBack={mockOnBack} />);

        const backButton = screen.getByRole('button', { name: /back/i });
        await user.click(backButton);

        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('shows error state when loading fails', () => {
        mockUseNoteDetail.mockReturnValue({
            content: '',
            setContent: vi.fn(),
            isLoading: false,
            isSaving: false,
            error: 'Failed to load note'
        });

        render(<NoteDetailView note={mockNote} onBack={mockOnBack} />);

        expect(screen.getByText(/error loading note/i)).toBeInTheDocument();
        expect(screen.getByText('Failed to load note')).toBeInTheDocument();
    });

    it('displays content from hook', () => {
        render(<NoteDetailView note={mockNote} onBack={mockOnBack} />);

        // Should display note title
        expect(screen.getByText('my-note')).toBeInTheDocument();
    });
});