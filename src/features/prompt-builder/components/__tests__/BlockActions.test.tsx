import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BlockActions from '../BlockActions';

describe('BlockActions', () => {
    it('disables move up for first item', () => {
        render(<BlockActions index={0} total={3} onMoveUp={vi.fn()} onMoveDown={vi.fn()} onRemove={vi.fn()} />);
        expect(screen.getByTestId('move-up-btn')).toBeDisabled();
    });

    it('disables move down for last item', () => {
        render(<BlockActions index={2} total={3} onMoveUp={vi.fn()} onMoveDown={vi.fn()} onRemove={vi.fn()} />);
        expect(screen.getByTestId('move-down-btn')).toBeDisabled();
    });

    it('calls onRemove when remove clicked', () => {
        const onRemove = vi.fn();
        render(<BlockActions index={1} total={3} onMoveUp={vi.fn()} onMoveDown={vi.fn()} onRemove={onRemove} />);
        fireEvent.click(screen.getByTestId('remove-block-btn'));
        expect(onRemove).toHaveBeenCalled();
    });

    it('calls onMoveUp', () => {
        const onMoveUp = vi.fn();
        render(<BlockActions index={1} total={3} onMoveUp={onMoveUp} onMoveDown={vi.fn()} onRemove={vi.fn()} />);
        fireEvent.click(screen.getByTestId('move-up-btn'));
        expect(onMoveUp).toHaveBeenCalled();
    });
});
