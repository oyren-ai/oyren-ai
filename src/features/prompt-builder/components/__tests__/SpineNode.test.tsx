import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SpineNode from '../SpineNode';

describe('SpineNode', () => {
    it('renders with correct test id', () => {
        render(<SpineNode index={2} onRemove={vi.fn()} />);
        expect(screen.getByTestId('spine-node-2')).toBeInTheDocument();
    });

    it('calls onRemove when clicked', () => {
        const onRemove = vi.fn();
        render(<SpineNode index={0} onRemove={onRemove} />);
        fireEvent.click(screen.getByTestId('spine-node-0'));
        expect(onRemove).toHaveBeenCalled();
    });
});
