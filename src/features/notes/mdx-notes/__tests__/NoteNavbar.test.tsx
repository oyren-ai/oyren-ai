/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteNavbar from '../NoteNavbar.tsx';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual<any>('lucide-react');
    return {
        ...actual,
        ArrowLeft: () => <span data-testid="arrow-left-icon">ArrowLeft</span>,
        Edit: () => <span data-testid="edit-icon">Edit</span>,
        Eye: () => <span data-testid="eye-icon">Eye</span>,
        Trash2: () => <span data-testid="trash-icon">Trash2</span>
    };
});

describe('NoteNavbar', () => {
    const mockOnBack = vi.fn();
    const mockOnToggleEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const defaultProps = {
        title: 'My Test Note',
        isEditing: false,
        onBack: mockOnBack,
        onToggleEdit: mockOnToggleEdit,
        onDelete: mockOnDelete
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders note title', () => {
        render(<NoteNavbar {...defaultProps} />);

        expect(screen.getByText('My Test Note')).toBeInTheDocument();
    });

    it('renders back button with icon', () => {
        render(<NoteNavbar {...defaultProps} />);

        const backButton = screen.getByTitle('Back to notes list');
        expect(backButton).toBeInTheDocument();
        expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });

    it('renders edit button when not editing', () => {
        render(<NoteNavbar {...defaultProps} />);

        const editButton = screen.getByTitle('Edit');
        expect(editButton).toBeInTheDocument();
        expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    });

    it('renders preview button when editing', () => {
        render(<NoteNavbar {...defaultProps} isEditing={true} />);

        const previewButton = screen.getByTitle('Preview');
        expect(previewButton).toBeInTheDocument();
        expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', async () => {
        const user = userEvent.setup();
        render(<NoteNavbar {...defaultProps} />);

        const backButton = screen.getByTitle('Back to notes list');
        await user.click(backButton);

        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleEdit when edit button is clicked', async () => {
        const user = userEvent.setup();
        render(<NoteNavbar {...defaultProps} />);

        const editButton = screen.getByTitle('Edit');
        await user.click(editButton);

        expect(mockOnToggleEdit).toHaveBeenCalledTimes(1);
    });

    it('truncates long titles', () => {
        const longTitle = 'This is a very long note title that should be truncated';
        render(<NoteNavbar {...defaultProps} title={longTitle} />);

        const titleElement = screen.getByText(longTitle);
        expect(titleElement).toHaveClass('truncate');
    });
});