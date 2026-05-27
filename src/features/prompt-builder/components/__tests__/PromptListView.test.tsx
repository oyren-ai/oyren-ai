import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PromptListView from '../PromptListView';
import type { WorkspacePrompt } from '@/types/workspacePrompt';

const mockPrompts: WorkspacePrompt[] = [
    { id: '1', workspace_id: 'ws', title: 'First', blocks: '[]', created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '2', workspace_id: 'ws', title: 'Second', blocks: '[]', created_at: '2024-01-02', updated_at: '2024-01-02' },
];

describe('PromptListView', () => {
    it('shows loading state', () => {
        render(<PromptListView prompts={[]} isLoading={true} onSelect={vi.fn()} onNew={vi.fn()} />);
        expect(screen.getByText('Loading prompts...')).toBeInTheDocument();
    });

    it('renders empty state with feature description and CTA', () => {
        render(<PromptListView prompts={[]} isLoading={false} onSelect={vi.fn()} onNew={vi.fn()} />);
        expect(screen.getByText(/Build reusable prompts/)).toBeInTheDocument();
        expect(screen.getByText(/Compose prompts from reusable blocks/)).toBeInTheDocument();
        expect(screen.getByText(/Attach file contents/)).toBeInTheDocument();
        expect(screen.getByText(/Copy fully resolved/)).toBeInTheDocument();
        expect(screen.getByTestId('empty-new-prompt-btn')).toBeInTheDocument();
    });

    it('calls onNew when empty state CTA clicked', () => {
        const onNew = vi.fn();
        render(<PromptListView prompts={[]} isLoading={false} onSelect={vi.fn()} onNew={onNew} />);
        fireEvent.click(screen.getByTestId('empty-new-prompt-btn'));
        expect(onNew).toHaveBeenCalled();
    });

    it('renders prompt list', () => {
        render(<PromptListView prompts={mockPrompts} isLoading={false} onSelect={vi.fn()} onNew={vi.fn()} />);
        expect(screen.getByText('First')).toBeInTheDocument();
        expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('calls onNew when new button clicked with prompts', () => {
        const onNew = vi.fn();
        render(<PromptListView prompts={mockPrompts} isLoading={false} onSelect={vi.fn()} onNew={onNew} />);
        fireEvent.click(screen.getByTestId('new-prompt-btn'));
        expect(onNew).toHaveBeenCalled();
    });

    it('calls onSelect when prompt clicked', () => {
        const onSelect = vi.fn();
        render(<PromptListView prompts={mockPrompts} isLoading={false} onSelect={onSelect} onNew={vi.fn()} />);
        fireEvent.click(screen.getByTestId('prompt-item-1'));
        expect(onSelect).toHaveBeenCalledWith(mockPrompts[0]);
    });
});
