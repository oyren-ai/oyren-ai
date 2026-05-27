import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNotes } from './hooks/useNotes.ts';
import { useNoteActions } from './hooks/useNoteActions.ts';
import { useInitializeDefaultNote } from './hooks/useInitializeDefaultNote.ts';
import { useCreateNoteModal } from '@/contexts/ModalContext.tsx';
import NotesList from './NotesList.tsx';
import NoteDetailView from './NoteDetailView.tsx';
import EmptyNotesState from './EmptyNotesState.tsx';
import { NoteDialogs } from './NoteDialogs.tsx';
import type { WorkspaceFile } from '@/types/workspace.ts';
import { useViewNavigation } from '@/contexts/NavigationContext.tsx';
import { useCreateMdxNote } from '@/features/notes/mdx-notes/hooks/useCreateMdxNote.ts';

export default function NotesPanel() {
    const { selectedWorkspace } = useViewNavigation();
    const { files, isLoading, selectedFile, setSelectedFile, loadFiles } = useNotes(selectedWorkspace?.id);
    const { createNote, isCreating } = useCreateMdxNote(selectedWorkspace?.id);
    const createNoteModal = useCreateNoteModal();
    const noteActions = useNoteActions();
    const [showDetailView, setShowDetailView] = useState(false);

    useInitializeDefaultNote(selectedWorkspace?.id, files.length, isLoading);

    const handleCreateNote = async (noteName: string) => {
        const file = await createNote(noteName);
        if (file) { setSelectedFile(file); setShowDetailView(true); }
    };

    const handleFileSelect = (file: WorkspaceFile) => {
        setSelectedFile(file);
        setShowDetailView(true);
    };

    if (showDetailView && selectedFile) {
        return (
            <NoteDetailView
                note={selectedFile}
                onBack={() => setShowDetailView(false)}
                onNoteDeleted={loadFiles}
            />
        );
    }

    return (
        <>
            <div className="flex flex-col h-full" data-testid="notes-panel">
                <div className="p-3 border-b border-border">
                    <button
                        onClick={() => createNoteModal.open()}
                        disabled={isCreating || !selectedWorkspace}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                        data-testid="create-note-button"
                    >
                        <Plus className="w-4 h-4" />
                        Create Note
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    {files.length === 0 && !isLoading ? (
                        <EmptyNotesState />
                    ) : (
                        <NotesList
                            files={files}
                            selectedFile={selectedFile}
                            onSelect={handleFileSelect}
                            onRename={noteActions.handleRenameNote}
                            onDelete={noteActions.handleDeleteNote}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>
            <NoteDialogs
                createDialogOpen={createNoteModal.isOpen}
                onCreateClose={createNoteModal.close}
                onCreateSubmit={handleCreateNote}
                renameDialogOpen={noteActions.renameDialogOpen}
                onRenameClose={noteActions.closeRenameDialog}
                renameFile={noteActions.selectedFile}
                onRenameConfirm={noteActions.handleRenameConfirm}
                deleteDialogOpen={noteActions.deleteDialogOpen}
                onDeleteClose={noteActions.closeDeleteDialog}
                deleteFile={noteActions.selectedFile}
                onDeleteConfirm={noteActions.handleDeleteConfirm}
            />
        </>
    );
}
