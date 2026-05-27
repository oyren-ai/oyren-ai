import React from 'react';
import { Plus, Type, FileText } from 'lucide-react';

interface AddBlockMenuProps {
    onAddText: () => void;
    onAddFile: () => void;
}

const AddBlockMenu: React.FC<AddBlockMenuProps> = ({ onAddText, onAddFile }) => (
    <div className="flex items-center justify-center gap-3 pt-2">
        <button onClick={onAddFile}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border border-dashed
                border-border hover:border-foreground/50 hover:bg-accent transition-all"
            data-testid="add-file-block-btn">
            <FileText className="w-3 h-3" /> File
        </button>
        <div className="w-6 h-6 rounded-full border-2 border-dashed border-foreground/30
            flex items-center justify-center hover:border-foreground/60 transition-colors">
            <Plus className="w-3 h-3 text-foreground/40" />
        </div>
        <button onClick={onAddText}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border border-dashed
                border-border hover:border-foreground/50 hover:bg-accent transition-all"
            data-testid="add-text-block-btn">
            <Type className="w-3 h-3" /> Text
        </button>
    </div>
);

export default AddBlockMenu;
