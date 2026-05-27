import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TextBlock from '../TextBlock';

describe('TextBlock', () => {
    it('renders with content', () => {
        render(<TextBlock content="hello" index={0} onChange={vi.fn()} />);
        expect(screen.getByTestId('text-block-input')).toHaveValue('hello');
    });

    it('calls onChange on input', () => {
        const onChange = vi.fn();
        render(<TextBlock content="" index={0} onChange={onChange} />);
        fireEvent.change(screen.getByTestId('text-block-input'), { target: { value: 'world' } });
        expect(onChange).toHaveBeenCalledWith('world');
    });
});
