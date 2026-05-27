export interface WorkspacePrompt {
    id: string;
    workspace_id: string;
    title: string;
    blocks: string;
    created_at: string;
    updated_at: string;
}

export interface PromptBlock {
    type: 'text' | 'file';
    content?: string;
    fileId?: string;
    fileName?: string;
}
