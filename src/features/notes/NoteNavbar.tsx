import React from 'react';
import { ArrowLeft, Edit2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';

interface NoteNavbarProps {
    title: string;
    isEditing: boolean;
    onBack: () => void;
    onToggleEdit: () => void;
}

const NoteNavbar: React.FC<NoteNavbarProps> = ({ title, isEditing, onBack, onToggleEdit }) => {
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-950">
            <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                title="Back to notes list"
            >
                <ArrowLeft className="w-4 h-4" />
            </Button>

            <h2 className="flex-1 text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                {title}
            </h2>

            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleEdit}
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title={isEditing ? "Preview" : "Edit"}
            >
                {isEditing ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </Button>
        </div>
    );
};

export default NoteNavbar;