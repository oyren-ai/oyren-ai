import React, { useState, useMemo } from 'react';
import type { WorkspaceFile } from '@/types/workspace.ts';
import { useNoteDetail } from './hooks/useNoteDetail.ts';
import { workspaceFilesApi } from '@/api/workspaceFilesApi.ts';
import NoteNavbar from './NoteNavbar.tsx';
import MarkdownViewer from './MarkdownViewer.tsx';
import NoteEditor from './NoteEditor.tsx';
import DeleteNoteDialog from './DeleteNoteDialog.tsx';
import LatexViewer from '@/components/common/LatexViewer.tsx';
import { getNoteName, getNoteType } from './utils/noteUtils.ts';

interface NoteDetailViewProps {
    note: WorkspaceFile;
    onBack: () => void;
    onNoteDeleted?: () => void;
}

const NoteDetailView: React.FC<NoteDetailViewProps> = ({ note, onBack, onNoteDeleted }) => {
    const { content, setContent, isLoading, isSaving, error } = useNoteDetail(note);
    const [isEditing, setIsEditing] = useState(false);
    const noteType = getNoteType(note);
    const isLatex = noteType === 'latex';
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const noteName = getNoteName(note);

    const imageBasePath = useMemo(() => {
        if (!note.file_path) return undefined;
        const parts = note.file_path.replace(/\\/g, '/').split('/');
        parts.pop(); // remove filename
        return parts.join('/') || undefined;
    }, [note.file_path]);

    const handleToggleEdit = () => {
        setIsEditing(!isEditing);
    };

    const handleDeleteClick = () => {
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await workspaceFilesApi.removeFile(note.id);
            setShowDeleteDialog(false);
            onNoteDeleted?.();
            onBack();
        } catch (err) {
            console.error('Error deleting note:', err);
            alert('Failed to delete note: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteDialog(false);
    };

    return (
        <>
            <div className="flex flex-col h-full custom-scrollbar" data-testid="note-detail-view">
                <NoteNavbar
                    title={noteName}
                    isEditing={isEditing}
                    onBack={onBack}
                    onToggleEdit={handleToggleEdit}
                    onDelete={handleDeleteClick}
                />

                <div className="flex-1 overflow-hidden">
                    {error ? (
                        <div className="flex items-center justify-center h-full p-8">
                            <div className="text-center max-w-md">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <p className="text-base font-semibold text-destructive mb-2">
                                    Error loading note
                                </p>
                                <p className="text-sm text-muted-foreground">{error}</p>
                            </div>
                        </div>
                    ) : isEditing ? (
                        <NoteEditor
                            content={content}
                            onChange={setContent}
                            isSaving={isSaving}
                            isLoading={isLoading}
                            language={isLatex ? 'latex' : 'markdown'}
                        />
                    ) : isLatex ? (
                        <div className="h-full overflow-y-auto custom-scrollbar latex-viewer-wrapper">
                            <LatexViewer latex={content} className="latex-viewer-document" />
                        </div>
                    ) : (
                        <MarkdownViewer content={content} isLoading={isLoading} imageBasePath={imageBasePath} />
                    )}
                </div>
            </div>

            <DeleteNoteDialog
                open={showDeleteDialog}
                noteName={noteName}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default NoteDetailView;