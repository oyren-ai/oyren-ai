import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PromptTitleInput from '../PromptTitleInput';

describe('PromptTitleInput', () => {
    it('renders with value', () => {
        render(<PromptTitleInput value="My Prompt" onChange={vi.fn()} />);
        expect(screen.getByTestId('prompt-title-input')).toHaveValue('My Prompt');
    });

    it('calls onChange on input', () => {
        const onChange = vi.fn();
        render(<PromptTitleInput value="" onChange={onChange} />);
        fireEvent.change(screen.getByTestId('prompt-title-input'), { target: { value: 'new' } });
        expect(onChange).toHaveBeenCalledWith('new');
    });
});
