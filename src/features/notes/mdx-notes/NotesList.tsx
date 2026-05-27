import React from 'react';
import { FileCode, Loader2, NotebookText } from 'lucide-react';
import { cn } from '@/utils/cn.ts';
import { NoteItemActions } from './NoteItemActions.tsx';
import type { WorkspaceFile } from '@/types/workspace.ts';
import { getNoteName, getNoteType } from './utils/noteUtils.ts';

interface NotesListProps {
    files: WorkspaceFile[];
    selectedFile: WorkspaceFile | null;
    onSelect: (file: WorkspaceFile) => void;
    onRename: (file: WorkspaceFile) => void;
    onDelete: (file: WorkspaceFile) => void;
    isLoading: boolean;
}

const NotesList: React.FC<NotesListProps> = ({
    files,
    selectedFile,
    onSelect,
    onRename,
    onDelete,
    isLoading
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No notes yet. Create a note to get started.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-2" data-testid="notes-list">
            {files.map(file => (
                <button
                    key={file.id}
                    onClick={() => onSelect(file)}
                    data-testid={`note-item-${file.id}`}
                    className={cn(
                        'group/note-item flex items-center gap-3 p-3 text-left rounded-lg mb-1',
                        'hover:bg-accent transition-all duration-200',
                        'border border-transparent',
                        selectedFile?.id === file.id
                            ? 'bg-accent border-primary shadow-sm'
                            : 'hover:border-border'
                    )}
                >
                    <div className={cn(
                        'p-1.5 rounded-md',
                        selectedFile?.id === file.id
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                    )}>
                        {getNoteType(file) === 'latex' ? (
                            <FileCode className="w-4 h-4 flex-shrink-0" />
                        ) : (
                            <NotebookText className="w-4 h-4 flex-shrink-0" />
                        )}
                    </div>
                    <span className={cn(
                        'flex-1 truncate text-sm font-medium',
                        selectedFile?.id === file.id
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                    )}>
                        {getNoteName(file)}
                    </span>
                    <NoteItemActions
                        onRename={() => onRename(file)}
                        onDelete={() => onDelete(file)}
                    />
                </button>
            ))}
        </div>
    );
};

export default NotesList;
