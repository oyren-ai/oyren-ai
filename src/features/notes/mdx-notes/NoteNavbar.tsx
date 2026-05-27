import React from 'react';
import { ArrowLeft, Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';

interface NoteNavbarProps {
    title: string;
    isEditing: boolean;
    onBack: () => void;
    onToggleEdit: () => void;
    onDelete: () => void;
}

const NoteNavbar: React.FC<NoteNavbarProps> = ({ title, isEditing, onBack, onToggleEdit, onDelete }) => {
    return (
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-9 w-9 rounded-lg hover:bg-accent transition-all duration-200"
                title="Back to notes list"
            >
                <ArrowLeft className="w-4 h-4" />
            </Button>

            <h2 className="flex-1 text-base font-semibold truncate text-foreground">
                {title}
            </h2>

            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleEdit}
                className="h-9 w-9 rounded-lg hover:bg-accent transition-all duration-200"
                title={isEditing ? "Preview" : "Edit"}
            >
                {isEditing ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            </Button>

            <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                title="Delete note"
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
};

export default NoteNavbar;