import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarksDropdown from '../BookmarksDropdown';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: () => <span>X</span>,
  List: () => <span>List</span>,
  Bookmark: () => <span>Bookmark</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  Plus: () => <span>Plus</span>,
  Check: () => <span>Check</span>,
  Pin: () => <span>Pin</span>,
  Edit: () => <span>Edit</span>,
  Trash2: () => <span>Trash2</span>,
  Highlighter: () => <span>Highlighter</span>,
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuRadioGroup: ({ children, onValueChange }: any) => (
    <div data-testid="radio-group" onClick={() => onValueChange?.('toc')}>
      {children}
    </div>
  ),
  DropdownMenuRadioItem: ({ children, value, disabled }: any) => (
    <div data-value={value} data-disabled={disabled}>{children}</div>
  ),
  DropdownMenuTrigger: ({ children, asChild }: any) => <div>{children}</div>,
}));

// Mock NavigationContext
vi.mock('@/contexts/NavigationContext', () => ({
  useViewNavigation: () => ({
    selectedWorkspace: { id: 'test-workspace-id', name: 'Test Workspace' },
  }),
}));

// Mock AppContext
vi.mock('@/contexts/AppContext', () => ({
  useAppContext: () => ({
    currentWorkspaceFileId: 'test-file-id',
  }),
}));

// Mock workspaceFilesApi
vi.mock('@/api/workspaceFilesApi', () => ({
  workspaceFilesApi: {
    listWorkspaceFiles: vi.fn().mockResolvedValue([
      { id: 'test-file-id', file_path: '/test/path.pdf', file_name: 'test.pdf' }
    ]),
  },
}));

// Mock useWorkspaceFileBookmarkApi hook with stateful behavior
let mockBookmarks: any[] = [];
let mockSetBookmarks: ((bookmarks: any[]) => void) | null = null;

const mockCreateBookmark = vi.fn().mockImplementation(async (page: number, description: string, metadata?: string) => {
  const newBookmark = {
    id: `bookmark-${Date.now()}-${Math.random()}`,
    workspace_id: 'test-workspace-id',
    workspace_file_id: 'test-file-id',
    bookmark_page: page,
    bookmark_description: description,
    date_created: new Date().toISOString(),
    metadata: metadata || null,
  };
  mockBookmarks = [...mockBookmarks, newBookmark];
  // Force update if setter is available
  if (mockSetBookmarks) {
    mockSetBookmarks([...mockBookmarks]);
  }
  return newBookmark;
});

const mockDeleteBookmark = vi.fn().mockImplementation(async (id: string) => {
  mockBookmarks = mockBookmarks.filter(b => b.id !== id);
  // Force update if setter is available
  if (mockSetBookmarks) {
    mockSetBookmarks([...mockBookmarks]);
  }
});

const mockReloadBookmarks = vi.fn().mockResolvedValue(undefined);

vi.mock('@/features/workspace-management/hooks/useWorkspaceFileBookmarkApi', () => {
  const React = require('react');
  return {
    useWorkspaceFileBookmarkApi: () => {
      const [localBookmarks, setLocalBookmarks] = React.useState(mockBookmarks);

      // Store setter for external updates
      React.useEffect(() => {
        mockSetBookmarks = setLocalBookmarks;
        return () => { mockSetBookmarks = null; };
      }, []);

      // Listen for bookmark events
      React.useEffect(() => {
        const handleCreated = () => setLocalBookmarks([...mockBookmarks]);
        const handleDeleted = () => setLocalBookmarks([...mockBookmarks]);

        window.addEventListener('bookmark-created', handleCreated);
        window.addEventListener('bookmark-deleted', handleDeleted);

        return () => {
          window.removeEventListener('bookmark-created', handleCreated);
          window.removeEventListener('bookmark-deleted', handleDeleted);
        };
      }, []);

      return {
        bookmarks: localBookmarks,
        loading: false,
        createBookmark: mockCreateBookmark,
        deleteBookmark: mockDeleteBookmark,
        reloadBookmarks: mockReloadBookmarks,
      };
    },
  };
});

describe('BookmarksDropdown', () => {
  const MockBookmarksComponent = () => <div data-testid="bookmarks-content">Mock Bookmarks</div>;
  const mockOnClose = vi.fn();
  const mockOnSaveBookmark = vi.fn();
  const mockJumpToPage = vi.fn();

  // Mock page navigation plugin
  const mockPageNavigationPlugin = {
    CurrentPageLabel: ({ children }: any) => children({ currentPage: 5, numberOfPages: 10 }),
    jumpToPage: mockJumpToPage,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockBookmarks = []; // Reset bookmarks before each test
  });

  describe('Visibility', () => {
    it('renders nothing when isVisible is false', () => {
      const { container } = render(
        <BookmarksDropdown
          isVisible={false}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders dropdown when isVisible is true', () => {
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      expect(screen.getAllByText('Bookmarks').length).toBeGreaterThan(0);
      expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
    });
  });

  describe('Overlay', () => {
    it('renders overlay when visible', () => {
      const { container } = render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      const overlay = container.querySelector('.bg-black\\/40');
      expect(overlay).toBeInTheDocument();
    });

    it('calls onClose when overlay is clicked', () => {
      const { container } = render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      const overlay = container.querySelector('.bg-black\\/40');
      fireEvent.click(overlay!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Header', () => {
    it('renders header with title', () => {
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      expect(screen.getAllByText('Bookmarks').length).toBeGreaterThan(0);
    });

    it('renders close button', () => {
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('calls onClose when close button is clicked', () => {
      const { container } = render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      const closeButton = container.querySelector('button.h-8.w-8.rounded-full');
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('View Mode Switching', () => {
    it('switches to TOC mode when radio group value changes', () => {
      const { container } = render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          hasToc={true}
        />
      );

      const radioGroup = screen.getByTestId('radio-group');
      fireEvent.click(radioGroup);

      // Should show TOC content
      expect(screen.getByTestId('bookmarks-content')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('renders bookmarks mode by default', () => {
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
      expect(screen.getByText('New Bookmark')).toBeInTheDocument();
    });

    it('renders new bookmark button', () => {
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      const newBookmarkButton = screen.getByText('New Bookmark');
      expect(newBookmarkButton).toBeInTheDocument();
    });
  });

  describe('Bookmark Creation', () => {
    it('shows creation form when New Bookmark button is clicked', () => {
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      const newButton = screen.getByText('New Bookmark');
      fireEvent.click(newButton);

      expect(screen.getByPlaceholderText('Bookmark description...')).toBeInTheDocument();
      expect(screen.getByText('0/50 characters')).toBeInTheDocument();
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      fireEvent.click(screen.getByText('New Bookmark'));
      const input = screen.getByPlaceholderText('Bookmark description...');

      await user.type(input, 'Test');
      expect(screen.getByText('4/50 characters')).toBeInTheDocument();
    });

    it('shows red character count when at limit', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          pageNavigationPlugin={mockPageNavigationPlugin}
        />
      );

      fireEvent.click(screen.getByText('New Bookmark'));
      const input = screen.getByPlaceholderText('Bookmark description...');

      // Type 50 characters
      await user.type(input, 'a'.repeat(50));

      const charCount = screen.getByText('50/50 characters');
      expect(charCount).toHaveClass('text-red-600');
    });

    it('saves bookmark when save button is clicked with valid text', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          onSaveBookmark={mockOnSaveBookmark}
          pageNavigationPlugin={mockPageNavigationPlugin}
        />
      );

      fireEvent.click(screen.getByText('New Bookmark'));
      const input = screen.getByPlaceholderText('Bookmark description...');

      await user.type(input, 'Important note');

      const saveButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('span')?.textContent === 'Check'
      );
      fireEvent.click(saveButton!);

      await waitFor(() => {
        expect(mockOnSaveBookmark).toHaveBeenCalledWith('Important note', 6);
      });
    });

    it('saves bookmark when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          onSaveBookmark={mockOnSaveBookmark}
          pageNavigationPlugin={mockPageNavigationPlugin}
        />
      );

      fireEvent.click(screen.getByText('New Bookmark'));
      const input = screen.getByPlaceholderText('Bookmark description...');

      await user.type(input, 'Quick note{Enter}');

      await waitFor(() => {
        expect(mockOnSaveBookmark).toHaveBeenCalledWith('Quick note', 6);
      });
    });

    it('cancels creation when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      fireEvent.click(screen.getByText('New Bookmark'));
      const input = screen.getByPlaceholderText('Bookmark description...');

      await user.type(input, 'Test{Escape}');

      expect(screen.queryByPlaceholderText('Bookmark description...')).not.toBeInTheDocument();
      expect(screen.getByText('New Bookmark')).toBeInTheDocument();
    });

    it('cancels creation when cancel button is clicked', async () => {
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      fireEvent.click(screen.getByText('New Bookmark'));

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Bookmark description...')).toBeInTheDocument();
      });

      // Find cancel button (ghost variant X button in the form with h-7 class)
      const allButtons = screen.getAllByRole('button');
      const cancelButton = allButtons.find(btn => {
        const hasX = btn.querySelector('span')?.textContent === 'X';
        const isGhostButton = btn.getAttribute('variant') === 'ghost';
        const isFormButton = btn.classList.contains('h-7');
        return hasX && isGhostButton && isFormButton;
      });

      expect(cancelButton).toBeDefined();
      fireEvent.click(cancelButton!);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Bookmark description...')).not.toBeInTheDocument();
        expect(screen.getByText('New Bookmark')).toBeInTheDocument();
      });
    });

    it('disables save button when input is empty', () => {
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      fireEvent.click(screen.getByText('New Bookmark'));

      const saveButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('span')?.textContent === 'Check'
      );
      expect(saveButton).toHaveAttribute('disabled');
    });

    it('does not save bookmark with only whitespace', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          onSaveBookmark={mockOnSaveBookmark}
        />
      );

      fireEvent.click(screen.getByText('New Bookmark'));
      const input = screen.getByPlaceholderText('Bookmark description...');

      await user.type(input, '   ');

      const saveButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('span')?.textContent === 'Check'
      );
      expect(saveButton).toHaveAttribute('disabled');
    });
  });

  describe('Bookmark Management', () => {
    it('displays created bookmarks', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          onSaveBookmark={mockOnSaveBookmark}
          pageNavigationPlugin={mockPageNavigationPlugin}
        />
      );

      // Create a bookmark
      fireEvent.click(screen.getByText('New Bookmark'));
      const input = screen.getByPlaceholderText('Bookmark description...');
      await user.type(input, 'Test bookmark{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Test bookmark')).toBeInTheDocument();
        expect(screen.getByText('Page 6')).toBeInTheDocument();
      });
    });

    it('pins a bookmark when pin button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          onSaveBookmark={mockOnSaveBookmark}
          pageNavigationPlugin={mockPageNavigationPlugin}
        />
      );

      // Create a bookmark
      fireEvent.click(screen.getByText('New Bookmark'));
      const input = screen.getByPlaceholderText('Bookmark description...');
      await user.type(input, 'Test bookmark{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Test bookmark')).toBeInTheDocument();
      });

      // Find and click pin button
      const pinButtons = screen.getAllByTitle('Pin');
      fireEvent.click(pinButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('📌')).toBeInTheDocument();
        expect(screen.getByTitle('Unpin')).toBeInTheDocument();
      });
    });

    it('unpins a pinned bookmark', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          onSaveBookmark={mockOnSaveBookmark}
          pageNavigationPlugin={mockPageNavigationPlugin}
        />
      );

      // Create and pin a bookmark
      fireEvent.click(screen.getByText('New Bookmark'));
      const input = screen.getByPlaceholderText('Bookmark description...');
      await user.type(input, 'Test bookmark{Enter}');

      await waitFor(() => expect(screen.getByText('Test bookmark')).toBeInTheDocument());

      const pinButton = screen.getByTitle('Pin');
      fireEvent.click(pinButton);

      await waitFor(() => expect(screen.getByTitle('Unpin')).toBeInTheDocument());

      // Unpin
      const unpinButton = screen.getByTitle('Unpin');
      fireEvent.click(unpinButton);

      await waitFor(() => {
        expect(screen.queryByText('📌')).not.toBeInTheDocument();
        expect(screen.getByTitle('Pin')).toBeInTheDocument();
      });
    });

    it('edits a bookmark when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          onSaveBookmark={mockOnSaveBookmark}
          pageNavigationPlugin={mockPageNavigationPlugin}
        />
      );

      // Create a bookmark
      fireEvent.click(screen.getByText('New Bookmark'));
      let input = screen.getByPlaceholderText('Bookmark description...');
      await user.type(input, 'Original text{Enter}');

      await waitFor(() => expect(screen.getByText('Original text')).toBeInTheDocument());

      // Edit the bookmark
      const editButton = screen.getByTitle('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Bookmark description...')).toHaveValue('Original text');
        expect(screen.getByText('Edit Bookmark')).toBeInTheDocument();
      });

      // Modify text and save
      input = screen.getByPlaceholderText('Bookmark description...');
      await user.clear(input);
      await user.type(input, 'Updated text{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Updated text')).toBeInTheDocument();
        expect(screen.queryByText('Original text')).not.toBeInTheDocument();
      });
    });

    it('deletes a bookmark when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          onSaveBookmark={mockOnSaveBookmark}
          pageNavigationPlugin={mockPageNavigationPlugin}
        />
      );

      // Create a bookmark
      fireEvent.click(screen.getByText('New Bookmark'));
      const input = screen.getByPlaceholderText('Bookmark description...');
      await user.type(input, 'To be deleted{Enter}');

      await waitFor(() => expect(screen.getByText('To be deleted')).toBeInTheDocument());

      // Delete the bookmark
      const deleteButton = screen.getByTitle('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByText('To be deleted')).not.toBeInTheDocument();
        expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
      });
    });

    it('navigates to page when bookmark is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          onSaveBookmark={mockOnSaveBookmark}
          pageNavigationPlugin={mockPageNavigationPlugin}
        />
      );

      // Create a bookmark
      fireEvent.click(screen.getByText('New Bookmark'));
      const input = screen.getByPlaceholderText('Bookmark description...');
      await user.type(input, 'Jump to page{Enter}');

      await waitFor(() => expect(screen.getByText('Jump to page')).toBeInTheDocument());

      // Click the bookmark card (not a button)
      const bookmarkCard = screen.getByText('Jump to page').closest('.group');
      fireEvent.click(bookmarkCard!);

      expect(mockJumpToPage).toHaveBeenCalledWith(5); // Page 6 - 1 (0-based)
    });

    it('sorts pinned bookmarks first', async () => {
      const user = userEvent.setup();
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          onSaveBookmark={mockOnSaveBookmark}
          pageNavigationPlugin={mockPageNavigationPlugin}
        />
      );

      // Create two bookmarks
      fireEvent.click(screen.getByText('New Bookmark'));
      let input = screen.getByPlaceholderText('Bookmark description...');
      await user.type(input, 'First bookmark{Enter}');

      await waitFor(() => expect(screen.queryByPlaceholderText('Bookmark description...')).not.toBeInTheDocument());

      fireEvent.click(screen.getByText('New Bookmark'));
      input = screen.getByPlaceholderText('Bookmark description...');
      await user.type(input, 'Second bookmark{Enter}');

      await waitFor(() => expect(screen.getByText('Second bookmark')).toBeInTheDocument());

      // Bookmarks are sorted newest first, so "Second bookmark" is already first
      // Pin the first bookmark (which is "First bookmark", currently second in list)
      const pinButtons = screen.getAllByTitle('Pin');
      fireEvent.click(pinButtons[1]); // Pin "First bookmark" (second in display)

      await waitFor(() => {
        // Query specifically for bookmark text elements (p tags with bookmark content)
        const bookmarkTexts = Array.from(document.querySelectorAll('.group p.text-sm'))
          .map(el => el.textContent);
        // First bookmark should now appear first because it's pinned
        expect(bookmarkTexts[0]).toBe('First bookmark');
      });
    });
  });

  describe('Page Navigation Plugin Integration', () => {
    it('tracks current page from plugin', async () => {
      render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
          pageNavigationPlugin={mockPageNavigationPlugin}
        />
      );

      fireEvent.click(screen.getByText('New Bookmark'));

      // Wait for page number to update (CurrentPageLabel uses setTimeout)
      await waitFor(() => {
        expect(screen.getByText('Page 6')).toBeInTheDocument();
      });
    });

    it('does not render CurrentPageLabel when plugin is not provided', () => {
      const { container } = render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      // Should still work without plugin
      fireEvent.click(screen.getByText('New Bookmark'));
      expect(screen.getByText('Page 1')).toBeInTheDocument(); // Default page
    });
  });

  describe('Styling', () => {
    it('applies correct sidebar styles', () => {
      const { container } = render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      const sidebar = container.querySelector('.w-72');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass('absolute', 'left-0', 'top-0', 'bottom-0', 'z-50');
    });

    it('applies scrollable container for bookmarks', () => {
      const { container } = render(
        <BookmarksDropdown
          isVisible={true}
          onClose={mockOnClose}
          Bookmarks={MockBookmarksComponent}
        />
      );

      const scrollContainer = container.querySelector('.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });
  });
});