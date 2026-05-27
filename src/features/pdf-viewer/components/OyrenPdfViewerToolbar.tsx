import { Bookmark, Download } from 'lucide-react';
import { PdfViewerPluginsInstance } from '../hooks/usePdfViewerPlugins';
import PaginationControls from './PaginationControls';
import PdfDarkModeToggle from './PdfDarkModeToggle';
import PdfSearchBar from './PdfSearchBar';
import SnippetButton from './SnippetButton';
import ToolbarRotateDownload from './ToolbarRotateDownload';
import ZoomButtons from './ZoomButtons';

interface PdfSearchState {
  showSearch: boolean;
  searchKeyword: string;
  currentMatchIndex: number;
  totalMatches: number;
  searchOptions: { caseSensitive: boolean; wholeWords: boolean };
  searchStatus: { isSearching: boolean; hasError: boolean; errorMessage?: string };
  searchInputRef: React.RefObject<HTMLTextAreaElement>;
  setSearchKeyword: (value: string) => void;
  handleSearch: () => void;
  handleSearchKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleClearSearch: () => void;
  handleNextMatch: () => void;
  handlePreviousMatch: () => void;
  handleToggleSearch: () => void;
  handleInputBlur: () => void;
  toggleCaseSensitive: () => void;
  toggleWholeWords: () => void;
}

interface OyrenPdfViewerToolbarProps {
  currentScale: number;
  showBookmarks: boolean;
  isSnippetMode: boolean;
  pdfViewerPluginsInstance: PdfViewerPluginsInstance;
  pdfSearchState: PdfSearchState;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleBookmarks: () => void;
  onSnippetClick: () => void;
  onDownload: () => void;
  isDarkMode: boolean;
  darkBackground: boolean;
  onToggleDarkBackground: () => void;
}

/** Toolbar layout aligned with web `WorkspacePdfViewerToolbar` (dark strip, segmented controls, pill actions). */
export default function OyrenPdfViewerToolbar({
  currentScale,
  showBookmarks,
  isSnippetMode,
  pdfViewerPluginsInstance,
  pdfSearchState,
  onZoomIn,
  onZoomOut,
  onToggleBookmarks,
  onSnippetClick,
  onDownload,
  isDarkMode,
  darkBackground,
  onToggleDarkBackground,
}: OyrenPdfViewerToolbarProps) {
  const {
    searchKeyword,
    currentMatchIndex,
    totalMatches,
    searchOptions,
    searchStatus,
    searchInputRef,
    setSearchKeyword,
    handleSearch,
    handleSearchKeyPress,
    handleClearSearch,
    handleNextMatch,
    handlePreviousMatch,
    handleToggleSearch,
    handleInputBlur,
    toggleCaseSensitive,
    toggleWholeWords,
  } = pdfSearchState;

  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto overflow-y-visible border-b border-neutral-200 bg-white px-2 py-1.5 text-xs dark:border-neutral-800 dark:bg-neutral-950 md:px-3">
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleBookmarks}
          title={
            showBookmarks
              ? 'Hide navigation panel'
              : 'Bookmarks & Table of Contents'
          }
          aria-pressed={showBookmarks}
          aria-label="Bookmarks & Table of Contents"
          className={`inline-flex items-center justify-center rounded-md border border-neutral-200 px-2 py-1 text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 ${
            showBookmarks ? 'bg-neutral-100 dark:bg-neutral-800' : ''
          }`}
        >
          <Bookmark className="h-3.5 w-3.5" />
        </button>

        <ZoomButtons currentScale={currentScale} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />

        <div className="flex shrink-0 items-center gap-1.5">
          <PaginationControls pageNavigationPlugin={pdfViewerPluginsInstance.pageNavigationPlugin} />

          <ToolbarRotateDownload rotatePlugin={pdfViewerPluginsInstance.rotatePlugin} />
          <PdfSearchBar
            showSearch={pdfSearchState.showSearch}
            searchKeyword={searchKeyword}
            currentMatchIndex={currentMatchIndex}
            totalMatches={totalMatches}
            caseSensitive={searchOptions.caseSensitive}
            wholeWords={searchOptions.wholeWords}
            isSearching={searchStatus.isSearching}
            searchInputRef={searchInputRef}
            onToggleSearch={handleToggleSearch}
            onSearchKeywordChange={setSearchKeyword}
            onSearchKeyPress={handleSearchKeyPress}
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
            onNextMatch={handleNextMatch}
            onPreviousMatch={handlePreviousMatch}
            onInputBlur={handleInputBlur}
            onToggleCaseSensitive={toggleCaseSensitive}
            onToggleWholeWords={toggleWholeWords}
          />
        </div>


      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:ml-auto">
        <SnippetButton isActive={isSnippetMode} onClick={onSnippetClick} />
        <button
          type="button"
          onClick={onDownload}
          title="Download"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <PdfDarkModeToggle
          isDarkMode={isDarkMode}
          darkBackground={darkBackground}
          onToggleDarkBackground={onToggleDarkBackground}
        />
      </div>
    </div>
  );
}
