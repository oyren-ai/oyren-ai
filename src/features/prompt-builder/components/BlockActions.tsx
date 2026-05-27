import React from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockActionsProps {
    index: number;
    total: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
}

const BlockActions: React.FC<BlockActionsProps> = ({ index, total, onMoveUp, onMoveDown, onRemove }) => (
    <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onMoveUp}
            disabled={index === 0} data-testid="move-up-btn">
            <ChevronUp className="w-3 h-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onMoveDown}
            disabled={index === total - 1} data-testid="move-down-btn">
            <ChevronDown className="w-3 h-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={onRemove}
            data-testid="remove-block-btn">
            <Trash2 className="w-3 h-3" />
        </Button>
    </div>
);

export default BlockActions;
