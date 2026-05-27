import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useViewNavigation } from '@/contexts/NavigationContext.tsx';
import { useLatexNotesContext } from '@/contexts/LatexNotesContext.tsx';
import { useLatexNotes } from './hooks/useLatexNotes.ts';
import { useCreateLatexNote } from '@/features/notes/mdx-notes/hooks/useCreateLatexNote.ts';
import { useNoteActions } from '@/features/notes/mdx-notes/hooks/useNoteActions.ts';
import NoteDetailView from '@/features/notes/mdx-notes/NoteDetailView.tsx';
import NotesList from '@/features/notes/mdx-notes/NotesList.tsx';
import { CreateLatexNoteDialog } from './CreateLatexNoteDialog.tsx';
import { NoteDialogs } from '@/features/notes/mdx-notes/NoteDialogs.tsx';
import type { WorkspaceFile } from '@/types/workspace.ts';
import { workspaceFilesApi } from '@/api/workspaceFilesApi.ts';

export default function LatexNotesPanel() {
  const { selectedWorkspace } = useViewNavigation();
  const { files, isLoading, selectedFile, setSelectedFile, loadFiles } = useLatexNotes(selectedWorkspace?.id);
  const { createLatexNote, isCreating } = useCreateLatexNote(selectedWorkspace?.id);
  const { fileIdToOpen, setFileIdToOpen } = useLatexNotesContext();
  const noteActions = useNoteActions();
  const [showDetailView, setShowDetailView] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // When sidebar asks to open a .tex file, select it and show detail view
  useEffect(() => {
    if (!fileIdToOpen || !selectedWorkspace?.id) return;

    const openFile = async () => {
      try {
        const file = await workspaceFilesApi.getWorkspaceFile(fileIdToOpen);
        setSelectedFile(file);
        setShowDetailView(true);
      } catch (e) {
        console.error('Failed to open LaTeX file:', e);
      } finally {
        setFileIdToOpen(null);
      }
    };

    void openFile();
  }, [fileIdToOpen, selectedWorkspace?.id, setSelectedFile, setFileIdToOpen]);

  const handleCreateNote = async (noteName: string) => {
    const file = await createLatexNote(noteName);
    if (file) {
      setSelectedFile(file);
      setShowDetailView(true);
    }
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
      <div className="flex flex-col h-full" data-testid="latex-notes-panel">
        <div className="p-3 border-b border-border">
          <button
            onClick={() => setCreateDialogOpen(true)}
            disabled={isCreating || !selectedWorkspace?.id}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            data-testid="create-latex-note-button"
          >
            <Plus className="w-4 h-4" />
            Create LaTeX Note
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {files.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">No LaTeX notes yet.</p>
              <p className="text-xs text-muted-foreground">Create a LaTeX note or open one from the sidebar.</p>
            </div>
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
      <CreateLatexNoteDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateNote}
      />
      <NoteDialogs
        createDialogOpen={false}
        onCreateClose={() => {}}
        onCreateSubmit={async () => {}}
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
