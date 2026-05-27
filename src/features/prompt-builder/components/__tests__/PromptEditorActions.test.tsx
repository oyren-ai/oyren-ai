import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PromptEditorActions from '../PromptEditorActions';

const defaults = {
    isSaving: false, isResolving: false, resolved: false,
    canResolve: true, showDelete: true,
    onSave: vi.fn(), onResolve: vi.fn(), onDelete: vi.fn(),
};

describe('PromptEditorActions', () => {
    it('renders save button', () => {
        render(<PromptEditorActions {...defaults} />);
        expect(screen.getByTestId('save-prompt-btn')).toBeInTheDocument();
    });

    it('calls onSave', () => {
        const onSave = vi.fn();
        render(<PromptEditorActions {...defaults} onSave={onSave} />);
        fireEvent.click(screen.getByTestId('save-prompt-btn'));
        expect(onSave).toHaveBeenCalled();
    });

    it('shows Saving... when saving', () => {
        render(<PromptEditorActions {...defaults} isSaving={true} />);
        expect(screen.getByTestId('save-prompt-btn')).toHaveTextContent('Saving...');
    });

    it('shows Copied! when resolved', () => {
        render(<PromptEditorActions {...defaults} resolved={true} />);
        expect(screen.getByTestId('resolve-prompt-btn')).toHaveTextContent('Copied!');
    });

    it('hides resolve when canResolve is false', () => {
        render(<PromptEditorActions {...defaults} canResolve={false} />);
        expect(screen.queryByTestId('resolve-prompt-btn')).not.toBeInTheDocument();
    });

    it('hides delete when showDelete is false', () => {
        render(<PromptEditorActions {...defaults} showDelete={false} />);
        expect(screen.queryByTestId('delete-prompt-btn')).not.toBeInTheDocument();
    });
});
