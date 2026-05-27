import {describe, it, expect, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ApiKeyCard} from '../ApiKeyCard';
import type {AiProviderKey} from '@/types/aiProviderKey';

const mockApiKey: AiProviderKey = {
    id: "1",
    ai_provider: {
        id: "gemini",
        name: "gemini",
        created_at: "2024-01-01T00:00:00Z"
    },
    name: "Test API Key",
    key: "sk-test-1234567890abcdef",
    date_added: "2024-01-10T08:15:00Z",
    last_used_date: null,
    models: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', enabled: true },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', enabled: false }
    ]
};

describe('ApiKeyCard', () => {
    it('renders API key information correctly', () => {
        const mockOnClick = vi.fn();
        const mockOnEdit = vi.fn();
        const mockOnDelete = vi.fn();

        render(
            <ApiKeyCard
                apiKey={mockApiKey}
                onClick={mockOnClick}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        expect(screen.getByText('Test API Key')).toBeInTheDocument();
        expect(screen.getByText('••••••••••••cdef')).toBeInTheDocument();
        expect(screen.getByText(/Provider: gemini/)).toBeInTheDocument();
        expect(screen.getByText(/Added:/)).toBeInTheDocument();
    });

    it('calls onClick when card is clicked', async () => {
        const user = userEvent.setup();
        const mockOnClick = vi.fn();
        const mockOnEdit = vi.fn();
        const mockOnDelete = vi.fn();

        render(
            <ApiKeyCard
                apiKey={mockApiKey}
                onClick={mockOnClick}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        const card = screen.getByText('Test API Key').closest('div')?.parentElement;
        if (card) {
            await user.click(card);
        }

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('shows menu when three dots button is clicked', async () => {
        const user = userEvent.setup();
        const mockOnClick = vi.fn();
        const mockOnEdit = vi.fn();
        const mockOnDelete = vi.fn();

        render(
            <ApiKeyCard
                apiKey={mockApiKey}
                onClick={mockOnClick}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        const menuButton = screen.getByLabelText('Options');
        await user.click(menuButton);

        await waitFor(() => {
            expect(screen.getByText('Edit')).toBeInTheDocument();
            expect(screen.getByText('Delete')).toBeInTheDocument();
        });
    });

    it('calls onEdit when Edit is clicked', async () => {
        const user = userEvent.setup();
        const mockOnClick = vi.fn();
        const mockOnEdit = vi.fn();
        const mockOnDelete = vi.fn();

        render(
            <ApiKeyCard
                apiKey={mockApiKey}
                onClick={mockOnClick}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        const menuButton = screen.getByLabelText('Options');
        await user.click(menuButton);

        const editButton = await screen.findByText('Edit');
        await user.click(editButton);

        expect(mockOnEdit).toHaveBeenCalledTimes(1);
        expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('calls onDelete when Delete is clicked', async () => {
        const user = userEvent.setup();
        const mockOnClick = vi.fn();
        const mockOnEdit = vi.fn();
        const mockOnDelete = vi.fn();

        render(
            <ApiKeyCard
                apiKey={mockApiKey}
                onClick={mockOnClick}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );

        const menuButton = screen.getByLabelText('Options');
        await user.click(menuButton);

        const deleteButton = await screen.findByText('Delete');
        await user.click(deleteButton);

        expect(mockOnDelete).toHaveBeenCalledTimes(1);
        expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('applies selected styling when isSelected is true', () => {
        const mockOnClick = vi.fn();
        const mockOnEdit = vi.fn();
        const mockOnDelete = vi.fn();

        const {container} = render(
            <ApiKeyCard
                apiKey={mockApiKey}
                onClick={mockOnClick}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                isSelected={true}
            />
        );

        const card = container.querySelector('.border-primary');
        expect(card).toBeInTheDocument();
    });

    it('does not apply selected styling when isSelected is false', () => {
        const mockOnClick = vi.fn();
        const mockOnEdit = vi.fn();
        const mockOnDelete = vi.fn();

        const {container} = render(
            <ApiKeyCard
                apiKey={mockApiKey}
                onClick={mockOnClick}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                isSelected={false}
            />
        );

        const card = container.querySelector('.border-primary');
        expect(card).not.toBeInTheDocument();
    });
});