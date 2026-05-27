import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  ChevronDown,
  Bookmark as BookmarkIcon,
  List,
  Plus,
  Check,
  Pin,
  Edit,
  Trash2,
  Highlighter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspaceFileBookmarkApi } from '@/features/workspace-management/hooks/useWorkspaceFileBookmarkApi';
import type { WorkspaceFileBookmark } from '@/api/WorkspaceFileBookmarkApi';
import { useViewNavigation } from '@/contexts/NavigationContext';
import { useAppContext } from '@/contexts/AppContext';
import type { PdfHighlightColorId, PdfHighlightRecord } from '@/lib/pdfHighlightTypes';
import { PdfHighlightsPanel } from '@/features/pdf-viewer/highlight/PdfHighlightsPanel';

type ViewMode = 'toc' | 'bookmarks' | 'highlights';

interface BookmarkItem {
  id: string;
  page: number;
  text: string;
  isPinned: boolean;
  createdAt: string;
}

interface BookmarksDropdownProps {
  isVisible: boolean;
  onClose: () => void;
  Bookmarks: React.ComponentType;
  hasToc?: boolean;
  onSaveBookmark?: (text: string, page: number) => void;
  pageNavigationPlugin?: any;
  pdfFilePath?: string | null;
  highlights?: PdfHighlightRecord[];
  onJumpHighlight?: (h: PdfHighlightRecord) => void;
  onHighlightChangeColor?: (id: string, colorId: PdfHighlightColorId) => void;
  onHighlightDelete?: (id: string) => void;
}

const BookmarksDropdown: React.FC<BookmarksDropdownProps> = ({
  isVisible,
  onClose,
  Bookmarks,
  hasToc = true,
  onSaveBookmark,
  pageNavigationPlugin,
  pdfFilePath,
  highlights = [],
  onJumpHighlight = () => {},
  onHighlightChangeColor = () => {},
  onHighlightDelete = () => {},
}) => {
  const { selectedWorkspace } = useViewNavigation();
  const { currentWorkspaceFileId } = useAppContext();
  const workspaceId = selectedWorkspace?.id;

  const [viewMode, setViewMode] = useState<ViewMode>('bookmarks');
  const [isCreating, setIsCreating] = useState(false);
  const [bookmarkText, setBookmarkText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Use workspace_file_id from AppContext - required for bookmark operations
  const workspaceFileId = currentWorkspaceFileId || '';

  // Use backend hook
  const {
    bookmarks: backendBookmarks,
    loading,
    createBookmark: createBackendBookmark,
    deleteBookmark: deleteBackendBookmark,
  } = useWorkspaceFileBookmarkApi(workspaceId || '', workspaceFileId);

  // Convert backend bookmarks to frontend format
  const bookmarks: BookmarkItem[] = useMemo(() => {
    return backendBookmarks.map((b: WorkspaceFileBookmark) => {
      const metadata = b.metadata ? JSON.parse(b.metadata) : {};
      return {
        id: b.id,
        page: b.bookmark_page,
        text: b.bookmark_description,
        isPinned: metadata.isPinned ?? false,
        createdAt: b.date_created,
      };
    });
  }, [backendBookmarks]);

  const viewConfig = {
    toc: { icon: List, label: 'Table of Contents' },
    bookmarks: { icon: BookmarkIcon, label: 'Bookmarks' },
    highlights: { icon: Highlighter, label: 'Highlights' },
  };

  const CurrentIcon = viewConfig[viewMode].icon;
  const currentLabel = viewConfig[viewMode].label;

  // Sort bookmarks: pinned first, then by creation date (newest first)
  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [bookmarks]);

  const handlePinToggle = useCallback(async (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (!bookmark) return;

    try {
      await deleteBackendBookmark(id);
      const metadata = JSON.stringify({ isPinned: !bookmark.isPinned });
      await createBackendBookmark(bookmark.page, bookmark.text, metadata);
      window.dispatchEvent(new CustomEvent('bookmark-created'));
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  }, [bookmarks, deleteBackendBookmark, createBackendBookmark]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteBackendBookmark(id);
      window.dispatchEvent(new CustomEvent('bookmark-deleted'));
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  }, [deleteBackendBookmark]);

  const handleEdit = useCallback((id: string) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) {
      setBookmarkText(bookmark.text);
      setEditingId(id);
      setIsCreating(true);
    }
  }, [bookmarks]);

  const handleSave = useCallback(async () => {
    if (!bookmarkText.trim()) return;

    // Validate workspace file ID is available
    if (!currentWorkspaceFileId) {
      console.error('Cannot create bookmark: workspace file ID is missing');
      // TODO: Show user-friendly error toast/notification
      return;
    }

    try {
      if (editingId) {
        // Edit: delete old + create new (no update in backend)
        const bookmark = bookmarks.find(b => b.id === editingId);
        if (bookmark) {
          await deleteBackendBookmark(editingId);
          const metadata = JSON.stringify({ isPinned: bookmark.isPinned });
          await createBackendBookmark(bookmark.page, bookmarkText.trim(), metadata);
        }
        setEditingId(null);
      } else {
        // Create new bookmark
        const metadata = JSON.stringify({ isPinned: false });
        await createBackendBookmark(currentPage, bookmarkText.trim(), metadata);
        onSaveBookmark?.(bookmarkText.trim(), currentPage);
      }

      window.dispatchEvent(new CustomEvent('bookmark-created'));
      setBookmarkText('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save bookmark:', error);
    }
  }, [bookmarkText, editingId, bookmarks, currentPage, currentWorkspaceFileId, createBackendBookmark, deleteBackendBookmark, onSaveBookmark]);

  const handleCancel = () => {
    setBookmarkText('');
    setIsCreating(false);
    setEditingId(null);
  };

  const handleBookmarkClick = (pageNumber: number) => {
    if (pageNavigationPlugin?.jumpToPage) {
      // react-pdf-viewer uses 0-based page indexing
      pageNavigationPlugin.jumpToPage(pageNumber - 1);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="absolute left-0 top-0 bottom-0 z-50 w-72 bg-background dark:bg-neutral-950 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        {/* Hidden component to track current page using CurrentPageLabel */}
        {pageNavigationPlugin?.CurrentPageLabel && (
          <div style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}>
            <pageNavigationPlugin.CurrentPageLabel>
              {(props: { currentPage: number; numberOfPages: number }) => {
                // Update state when page changes
                // CurrentPageLabel uses 0-based indexing, convert to 1-based
                const pageNumber = props.currentPage + 1;
                if (pageNumber !== currentPage) {
                  setTimeout(() => setCurrentPage(pageNumber), 0);
                }
                return null;
              }}
            </pageNavigationPlugin.CurrentPageLabel>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {/* View Mode Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <CurrentIcon className="w-4 h-4" />
                <span>{currentLabel}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              <DropdownMenuRadioGroup value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <DropdownMenuRadioItem value="toc" disabled={!hasToc}>
                  <List className="w-4 h-4 mr-2" />
                  Table of Contents
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="bookmarks">
                  <BookmarkIcon className="w-4 h-4 mr-2" />
                  Bookmarks
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="highlights">
                  <Highlighter className="w-4 h-4 mr-2" />
                  Highlights
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div
          className={
            viewMode === 'highlights'
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'flex min-h-0 flex-1 flex-col overflow-y-auto p-3 custom-scrollbar'
          }
        >
          {viewMode === 'toc' ? (
            <div className="bookmarks-container">
              <Bookmarks />
            </div>
          ) : viewMode === 'highlights' ? (
            <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 pt-1">
              <PdfHighlightsPanel
                highlights={highlights}
                onJump={onJumpHighlight}
                onChangeColor={onHighlightChangeColor}
                onDelete={onHighlightDelete}
                embedded
              />
            </div>
          ) : (
            <div>
              {/* New Bookmark Button */}
              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 mb-3 text-sm font-medium rounded-md border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Bookmark
                </button>
              )}

              {/* Bookmark Creation/Edit Form */}
              {isCreating && (
                <div className="border-b border-indigo-200 dark:border-indigo-700 pb-3 mb-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                    <span className="font-medium">
                      {editingId ? 'Edit Bookmark' : `Page ${currentPage}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      maxLength={50}
                      value={bookmarkText}
                      onChange={(e) => setBookmarkText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && bookmarkText.trim()) {
                          e.preventDefault();
                          handleSave();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          handleCancel();
                        }
                      }}
                      placeholder="Bookmark description..."
                      className="flex-1 px-2 py-1.5 text-sm bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    />
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!bookmarkText.trim()}
                      className="h-7 w-7 p-0 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancel}
                      className="h-7 w-7 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className={`text-xs mt-1 ${
                    bookmarkText.length >= 50
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {bookmarkText.length}/50 characters
                  </div>
                </div>
              )}

              {/* Bookmarks List */}
              {sortedBookmarks.length > 0 && !isCreating && (
                <div className="space-y-2">
                  {sortedBookmarks.map(bookmark => (
                    <div
                      key={bookmark.id}
                      onClick={() => handleBookmarkClick(bookmark.page)}
                      className="group relative bg-card p-3 border border-border rounded-lg hover:shadow-md hover:bg-accent/5 dark:hover:bg-accent/10 transition-all duration-200 cursor-pointer"
                    >
                      {/* Header: Page number + Pin badge */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">
                            Page {bookmark.page}
                          </span>
                          {bookmark.isPinned && (
                            <span className="text-xs">📌</span>
                          )}
                        </div>

                        {/* Action Buttons - Always Visible */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePinToggle(bookmark.id);
                            }}
                            className={`h-6 w-6 flex items-center justify-center rounded-md transition-colors ${
                              bookmark.isPinned
                                ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-accent'
                            }`}
                            title={bookmark.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <Pin className={`w-3.5 h-3.5 ${bookmark.isPinned ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(bookmark.id);
                            }}
                            className="h-6 w-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-accent rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(bookmark.id);
                            }}
                            className="h-6 w-6 flex items-center justify-center text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-accent rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bookmark Text */}
                      <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                        {bookmark.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State - Only show when no bookmarks AND not creating */}
              {sortedBookmarks.length === 0 && !isCreating && (
                <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                  <BookmarkIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No bookmarks yet</p>
                  <p className="text-xs mt-1">Click "+ New Bookmark" to add one</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BookmarksDropdown;
