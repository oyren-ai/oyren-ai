import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddBlockMenu from '../AddBlockMenu';

describe('AddBlockMenu', () => {
    it('calls onAddText when text button clicked', () => {
        const onAddText = vi.fn();
        render(<AddBlockMenu onAddText={onAddText} onAddFile={vi.fn()} />);
        fireEvent.click(screen.getByTestId('add-text-block-btn'));
        expect(onAddText).toHaveBeenCalled();
    });

    it('calls onAddFile when file button clicked', () => {
        const onAddFile = vi.fn();
        render(<AddBlockMenu onAddText={vi.fn()} onAddFile={onAddFile} />);
        fireEvent.click(screen.getByTestId('add-file-block-btn'));
        expect(onAddFile).toHaveBeenCalled();
    });
});
