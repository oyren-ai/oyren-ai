import React from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn.ts';
import type { Note } from '@/types/note';

interface NotesListProps {
    notes: Note[];
    selectedNote: Note | null;
    onSelect: (note: Note) => void;
    isLoading: boolean;
}

const NotesList: React.FC<NotesListProps> = ({
    notes,
    selectedNote,
    onSelect,
    isLoading
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (notes.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No notes yet. Create a note to get started.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            {notes.map(note => (
                <button
                    key={note.id}
                    onClick={() => onSelect(note)}
                    className={cn(
                        'flex items-center gap-2 p-3 text-left border-b border-gray-200 dark:border-gray-800',
                        'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200',
                        selectedNote?.id === note.id &&
                        'bg-gray-100 dark:bg-gray-800 border-l-2 border-l-blue-500'
                    )}
                >
                    <FileText className="w-4 h-4 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                    <span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
                        {note.name || 'Untitled'}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default NotesList;