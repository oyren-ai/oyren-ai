import React from 'react';
import type { WorkspacePrompt } from '@/types/workspacePrompt';

interface PromptListItemProps {
    prompt: WorkspacePrompt;
    onClick: () => void;
}

const PromptListItem: React.FC<PromptListItemProps> = ({ prompt, onClick }) => (
    <button
        onClick={onClick}
        className="w-full text-left p-3 rounded-md border border-border hover:bg-accent transition-colors"
        data-testid={`prompt-item-${prompt.id}`}
    >
        <p className="text-sm font-medium truncate">{prompt.title}</p>
        <p className="text-xs text-muted-foreground mt-1">
            {new Date(prompt.updated_at).toLocaleDateString()}
        </p>
    </button>
);

export default PromptListItem;
