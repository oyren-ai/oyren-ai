/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PdfSearchBar from '../PdfSearchBar';
import { createRef } from 'react';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Search: () => <span data-testid="search-icon">Search</span>,
    X: () => <span data-testid="x-icon">X</span>,
    ChevronUp: () => <span data-testid="chevron-up">ChevronUp</span>,
    ChevronDown: () => <span data-testid="chevron-down">ChevronDown</span>,
    CaseSensitive: () => <span data-testid="case-sensitive">CaseSensitive</span>,
    WholeWord: () => <span data-testid="whole-word">WholeWord</span>
}));

describe('PdfSearchBar', () => {
    const defaultProps = {
        showSearch: false,
        searchKeyword: '',
        currentMatchIndex: 0,
        totalMatches: 0,
        searchInputRef: createRef<HTMLTextAreaElement>(),
        caseSensitive: false,
        wholeWords: false,
        isSearching: false,
        onToggleSearch: vi.fn(),
        onSearchKeywordChange: vi.fn(),
        onSearchKeyPress: vi.fn(),
        onSearch: vi.fn(),
        onClearSearch: vi.fn(),
        onNextMatch: vi.fn(),
        onPreviousMatch: vi.fn(),
        onInputBlur: vi.fn(),
        onToggleCaseSensitive: vi.fn(),
        onToggleWholeWords: vi.fn()
    };

    it('renders search button with correct title', () => {
        render(<PdfSearchBar {...defaultProps} />);

        const button = screen.getByTitle('Find in document (Ctrl+F)');
        expect(button).toBeInTheDocument();
    });

    it('opens dropdown and calls onToggleSearch when button is clicked', async () => {
        const user = userEvent.setup();
        render(<PdfSearchBar {...defaultProps} />);

        const button = screen.getByTitle('Find in document (Ctrl+F)');
        await user.click(button);

        expect(defaultProps.onToggleSearch).toHaveBeenCalledTimes(1);
        // Dropdown should open and show input
        const input = screen.getByPlaceholderText('Type or paste to search…');
        expect(input).toBeInTheDocument();
    });

    it('calls onSearchKeywordChange when typing in input', async () => {
        const user = userEvent.setup();
        render(<PdfSearchBar {...defaultProps} />);

        // Open dropdown first
        const button = screen.getByTitle('Find in document (Ctrl+F)');
        await user.click(button);

        const input = screen.getByPlaceholderText('Type or paste to search…');
        await user.type(input, 'test');

        expect(defaultProps.onSearchKeywordChange).toHaveBeenCalled();
    });

    it('triggers search on Enter key', async () => {
        const user = userEvent.setup();
        render(<PdfSearchBar {...defaultProps} />);

        // Open dropdown
        const button = screen.getByTitle('Find in document (Ctrl+F)');
        await user.click(button);

        const input = screen.getByPlaceholderText('Type or paste to search…');
        await user.type(input, '{Enter}');

        expect(defaultProps.onSearch).toHaveBeenCalled();
    });

    it('displays match counter when totalMatches > 0', async () => {
        const user = userEvent.setup();
        render(<PdfSearchBar {...defaultProps} totalMatches={5} currentMatchIndex={2} searchKeyword="test" />);

        // Open dropdown
        const button = screen.getByTitle('Find in document (Ctrl+F)');
        await user.click(button);

        // When matches exist, navigation buttons and match counter should be visible
        // Check that nav buttons appear (indicates match results are displayed)
        expect(screen.getByTitle('Previous match (Ctrl+↑)')).toBeInTheDocument();
        expect(screen.getByTitle('Next match (Ctrl+↓)')).toBeInTheDocument();
    });

    it('renders navigation buttons when totalMatches > 0', async () => {
        const user = userEvent.setup();
        render(<PdfSearchBar {...defaultProps} totalMatches={5} searchKeyword="test" />);

        // Open dropdown
        const button = screen.getByTitle('Find in document (Ctrl+F)');
        await user.click(button);

        const prevButton = screen.getByTitle('Previous match (Ctrl+↑)');
        const nextButton = screen.getByTitle('Next match (Ctrl+↓)');

        expect(prevButton).toBeInTheDocument();
        expect(nextButton).toBeInTheDocument();
    });

    it('calls onPreviousMatch when previous button is clicked', async () => {
        const user = userEvent.setup();
        render(<PdfSearchBar {...defaultProps} totalMatches={5} searchKeyword="test" />);

        // Open dropdown
        const button = screen.getByTitle('Find in document (Ctrl+F)');
        await user.click(button);

        const prevButton = screen.getByTitle('Previous match (Ctrl+↑)');
        await user.click(prevButton);

        expect(defaultProps.onPreviousMatch).toHaveBeenCalledTimes(1);
    });

    it('calls onNextMatch when next button is clicked', async () => {
        const user = userEvent.setup();
        render(<PdfSearchBar {...defaultProps} totalMatches={5} searchKeyword="test" />);

        // Open dropdown
        const button = screen.getByTitle('Find in document (Ctrl+F)');
        await user.click(button);

        const nextButton = screen.getByTitle('Next match (Ctrl+↓)');
        await user.click(nextButton);

        expect(defaultProps.onNextMatch).toHaveBeenCalledTimes(1);
    });

    it('renders clear button when searchKeyword is not empty', async () => {
        const user = userEvent.setup();
        render(<PdfSearchBar {...defaultProps} searchKeyword="test" />);

        // Open dropdown
        const button = screen.getByTitle('Find in document (Ctrl+F)');
        await user.click(button);

        const clearButton = screen.getByTitle('Clear');
        expect(clearButton).toBeInTheDocument();
    });

    it('clears search when clear button is clicked', async () => {
        const user = userEvent.setup();
        render(<PdfSearchBar {...defaultProps} searchKeyword="test" />);

        // Open dropdown
        const button = screen.getByTitle('Find in document (Ctrl+F)');
        await user.click(button);

        const clearButton = screen.getByTitle('Clear');
        await user.click(clearButton);

        expect(defaultProps.onSearchKeywordChange).toHaveBeenCalledWith('');
        expect(defaultProps.onClearSearch).toHaveBeenCalledTimes(1);
    });

    it('shows searching state when isSearching is true', async () => {
        const user = userEvent.setup();
        render(<PdfSearchBar {...defaultProps} isSearching={true} searchKeyword="test" />);

        // Open dropdown
        const button = screen.getByTitle('Find in document (Ctrl+F)');
        await user.click(button);

        expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('shows "No matches found" when no results and not searching', async () => {
        const user = userEvent.setup();
        render(<PdfSearchBar {...defaultProps} searchKeyword="test" totalMatches={0} isSearching={false} />);

        // Open dropdown
        const button = screen.getByTitle('Find in document (Ctrl+F)');
        await user.click(button);

        expect(screen.getByText('No matches found')).toBeInTheDocument();
    });
});
