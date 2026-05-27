import React from 'react';
import { Save, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromptEditorActionsProps {
    isSaving: boolean;
    isResolving: boolean;
    resolved: boolean;
    canResolve: boolean;
    onSave: () => void;
    onResolve: () => void;
    onDelete: () => void;
    showDelete: boolean;
}

const PromptEditorActions: React.FC<PromptEditorActionsProps> = ({
    isSaving, isResolving, resolved, canResolve, onSave, onResolve, onDelete, showDelete,
}) => (
    <div className="flex gap-2 pt-3 border-t border-border">
        <Button size="sm" onClick={onSave} disabled={isSaving} data-testid="save-prompt-btn">
            <Save className="w-3 h-3 mr-1" /> {isSaving ? 'Saving...' : 'Save'}
        </Button>
        {canResolve && (
            <Button size="sm" variant="outline" onClick={onResolve} disabled={isResolving}
                data-testid="resolve-prompt-btn">
                <Copy className="w-3 h-3 mr-1" /> {resolved ? 'Copied!' : 'Copy Resolved'}
            </Button>
        )}
        {showDelete && (
            <Button size="sm" variant="destructive" onClick={onDelete} data-testid="delete-prompt-btn">
                <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
        )}
    </div>
);

export default PromptEditorActions;
