import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileBlock from '../FileBlock';

describe('FileBlock', () => {
    it('renders file name', () => {
        render(<FileBlock fileName="test.pdf" index={0} onChangeFile={vi.fn()} />);
        expect(screen.getByTestId('file-block-name')).toHaveTextContent('test.pdf');
    });

    it('shows placeholder when no file', () => {
        render(<FileBlock index={0} onChangeFile={vi.fn()} />);
        expect(screen.getByTestId('file-block-name')).toHaveTextContent('Select file...');
    });

    it('calls onChangeFile when clicked', () => {
        const onChangeFile = vi.fn();
        render(<FileBlock fileName="test.pdf" index={0} onChangeFile={onChangeFile} />);
        fireEvent.click(screen.getByTestId('change-file-btn'));
        expect(onChangeFile).toHaveBeenCalled();
    });
});
