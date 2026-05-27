import { Search, X, ChevronUp, ChevronDown, CaseSensitive, WholeWord } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PdfSearchBarProps {
    showSearch: boolean;
    searchKeyword: string;
    currentMatchIndex: number;
    totalMatches: number;
    searchInputRef: React.RefObject<HTMLTextAreaElement>;
    caseSensitive: boolean;
    wholeWords: boolean;
    isSearching?: boolean;
    onToggleSearch: () => void;
    onSearchKeywordChange: (value: string) => void;
    onSearchKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onSearch: () => void;
    onClearSearch: () => void;
    onNextMatch: () => void;
    onPreviousMatch: () => void;
    onInputBlur: () => void;
    onToggleCaseSensitive: () => void;
    onToggleWholeWords: () => void;
}

export default function PdfSearchBar({
    showSearch: _showSearch,
    searchKeyword,
    currentMatchIndex,
    totalMatches,
    searchInputRef,
    caseSensitive,
    wholeWords,
    isSearching = false,
    onToggleSearch,
    onSearchKeywordChange,
    onSearchKeyPress,
    onSearch,
    onClearSearch,
    onNextMatch,
    onPreviousMatch,
    onInputBlur,
    onToggleCaseSensitive,
    onToggleWholeWords,
}: PdfSearchBarProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    /** Parent passes new `onSearch` each render when plugin/search state changes — must not be a useEffect dep or debounce retriggers forever. */
    const onSearchRef = useRef(onSearch);
    onSearchRef.current = onSearch;

    const autoResize = useCallback(() => {
        const el = searchInputRef.current;
        if (!el) return;
        el.style.height = '0';
        el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
    }, [searchInputRef]);

    const computePanelPosition = useCallback(() => {
        const btn = triggerRef.current;
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const maxW = 400;
        const minW = 280;
        const width = Math.min(maxW, Math.max(minW, window.innerWidth - 16));
        let left = r.right - width;
        if (left < 8) left = 8;
        const top = r.bottom + 8;
        setPanelStyle({
            position: 'fixed',
            top,
            left,
            width,
            zIndex: 10050,
        });
    }, []);

    useLayoutEffect(() => {
        if (!isDropdownOpen) {
            setPanelStyle(null);
            return;
        }
        computePanelPosition();
        const ro = new ResizeObserver(() => computePanelPosition());
        if (triggerRef.current) ro.observe(triggerRef.current);
        window.addEventListener('resize', computePanelPosition);
        window.addEventListener('scroll', computePanelPosition, true);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', computePanelPosition);
            window.removeEventListener('scroll', computePanelPosition, true);
        };
    }, [isDropdownOpen, computePanelPosition]);

    useEffect(() => {
        if (!isDropdownOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            const n = event.target as Node;
            if (triggerRef.current?.contains(n)) return;
            if (panelRef.current?.contains(n)) return;
            setIsDropdownOpen(false);
            onClearSearch();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen, onClearSearch]);

    useEffect(() => {
        autoResize();
    }, [searchKeyword, autoResize]);

    // Debounce typing only. Case/word toggles call `executeSearch` in `usePdfSearch` directly.
    useEffect(() => {
        if (!searchKeyword.trim() || !isDropdownOpen) return;
        const timer = window.setTimeout(() => {
            onSearchRef.current();
        }, 300);
        return () => window.clearTimeout(timer);
    }, [searchKeyword, isDropdownOpen]);

    const handleToggleDropdown = () => {
        const newState = !isDropdownOpen;
        setIsDropdownOpen(newState);
        if (newState) {
            onToggleSearch();
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else {
            onClearSearch();
        }
    };

    const hasMatches = totalMatches > 0;
    const hasSearchText = searchKeyword.trim().length > 0;

    const panel =
        isDropdownOpen && panelStyle ? (
            <div
                ref={panelRef}
                style={panelStyle}
                className="bg-white shadow-xl dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg overflow-hidden"
            >
                <div className="p-3 border-b border-gray-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-neutral-900 px-3 py-2 rounded-md border border-gray-200 dark:border-neutral-700">
                        <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />

                        <textarea
                            ref={searchInputRef}
                            rows={1}
                            value={searchKeyword}
                            autoCorrect="off"
                            onChange={(e) => onSearchKeywordChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onSearch();
                                } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setIsDropdownOpen(false);
                                    onClearSearch();
                                } else if (e.key === 'ArrowDown' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    if (hasMatches) onNextMatch();
                                } else if (e.key === 'ArrowUp' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    if (hasMatches) onPreviousMatch();
                                } else {
                                    onSearchKeyPress(e);
                                }
                            }}
                            placeholder="Type or paste to search…"
                            className="flex-1 resize-none overflow-hidden text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none border-none leading-snug"
                            autoFocus
                            onBlur={onInputBlur}
                        />

                        {hasSearchText && (
                            <button
                                type="button"
                                onClick={() => {
                                    onSearchKeywordChange('');
                                    onClearSearch();
                                }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                                title="Clear"
                            >
                                <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <button
                            type="button"
                            onClick={onToggleCaseSensitive}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${caseSensitive
                                ? 'bg-neutral-200 text-neutral-900 border border-neutral-400 dark:bg-white/15 dark:text-white dark:border-white/35'
                                : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-neutral-600'
                                }`}
                            title="Match case"
                        >
                            <CaseSensitive className="w-3.5 h-3.5" />
                            <span>Aa</span>
                        </button>

                        <button
                            type="button"
                            onClick={onToggleWholeWords}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${wholeWords
                                ? 'bg-neutral-200 text-neutral-900 border border-neutral-400 dark:bg-white/15 dark:text-white dark:border-white/35'
                                : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-neutral-600'
                                }`}
                            title="Match whole words"
                        >
                            <WholeWord className="w-3.5 h-3.5" />
                            <span>Word</span>
                        </button>
                    </div>
                </div>

                {hasSearchText && (
                    <div className="p-3">
                        {isSearching ? (
                            <div className="text-sm text-neutral-700 dark:text-white text-center py-1 flex items-center justify-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-neutral-500 dark:border-white/70 border-t-transparent rounded-full" />
                                Searching...
                            </div>
                        ) : hasMatches ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold text-neutral-900 dark:text-white">
                                            {currentMatchIndex + 1}
                                        </span>
                                        {' of '}
                                        <span className="font-semibold text-neutral-900 dark:text-white">
                                            {totalMatches}
                                        </span>
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={onPreviousMatch}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Previous match (Ctrl+↑)"
                                        disabled={totalMatches <= 1}
                                    >
                                        <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onNextMatch}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Next match (Ctrl+↓)"
                                        disabled={totalMatches <= 1}
                                    >
                                        <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-1">
                                No matches found
                            </div>
                        )}
                    </div>
                )}
            </div>
        ) : null;

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggleDropdown}
                aria-expanded={isDropdownOpen}
                className={`relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-colors sm:px-3 sm:text-sm ${
                    isDropdownOpen || hasMatches
                        ? 'border-neutral-200 bg-neutral-100 text-neutral-900 dark:border-neutral-600 dark:bg-white/15 dark:text-white'
                        : 'border-neutral-200 bg-white/90 text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-950/90 dark:text-white dark:hover:bg-white/10'
                }`}
                title="Find in document (Ctrl+F)"
            >
                <Search className="h-4 w-4 shrink-0" />
                {/* <span>Search</span> */}
                {hasMatches && (
                    <span
                        className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold leading-none text-neutral-950"
                        aria-hidden
                    >
                        {totalMatches > 99 ? '99+' : totalMatches}
                    </span>
                )}
            </button>
            {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
        </>
    );
}
