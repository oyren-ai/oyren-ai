import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkspacePrompt } from '@/types/workspacePrompt';
import PromptListItem from './PromptListItem';
import PromptListEmptyState from './PromptListEmptyState';

interface PromptListViewProps {
    prompts: WorkspacePrompt[];
    isLoading: boolean;
    onSelect: (prompt: WorkspacePrompt) => void;
    onNew: () => void;
}

const PromptListView: React.FC<PromptListViewProps> = ({ prompts, isLoading, onSelect, onNew }) => {
    if (isLoading) {
        return <div className="p-4 text-sm text-muted-foreground">Loading prompts...</div>;
    }

    if (prompts.length === 0) {
        return <PromptListEmptyState onNew={onNew} />;
    }

    return (
        <div className="flex flex-col gap-2 p-3">
            <Button onClick={onNew} size="sm" className="w-full" data-testid="new-prompt-btn">
                <Plus className="w-4 h-4 mr-1" /> New Prompt
            </Button>
            {prompts.map((p) => (
                <PromptListItem key={p.id} prompt={p} onClick={() => onSelect(p)} />
            ))}
        </div>
    );
};

export default PromptListView;
