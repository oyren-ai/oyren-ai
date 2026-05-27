import React from 'react';
import { Trash2 } from 'lucide-react';

interface SpineNodeProps {
    index: number;
    onRemove: () => void;
}

const SpineNode: React.FC<SpineNodeProps> = ({ index, onRemove }) => (
    <button
        onClick={onRemove}
        className="relative z-10 w-6 h-6 rounded-sm border-2 border-foreground/60 bg-background
            hover:border-destructive hover:bg-destructive/10 transition-all duration-200
            flex items-center justify-center group cursor-pointer shrink-0
            animate-node-appear"
        style={{ animationDelay: `${index * 80}ms` }}
        data-testid={`spine-node-${index}`}
        title="Remove block"
    >
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 group-hover:hidden" />
        <Trash2 className="w-3 h-3 text-destructive hidden group-hover:block" />
    </button>
);

export default SpineNode;
