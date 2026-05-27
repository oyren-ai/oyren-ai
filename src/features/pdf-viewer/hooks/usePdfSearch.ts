import { useState, useEffect, useRef, useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { buildSearchRegex } from '@/lib/buildSearchRegex';

interface UsePdfSearchProps {
    searchPluginInstance: any;
}

export interface SearchOptions {
    caseSensitive: boolean;
    wholeWords: boolean;
}

export interface SearchStatus {
    isSearching: boolean;
    hasError: boolean;
    errorMessage?: string;
}

export function usePdfSearch({ searchPluginInstance }: UsePdfSearchProps) {
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
    const [totalMatches, setTotalMatches] = useState<number>(0);
    const [searchOptions, setSearchOptions] = useState<SearchOptions>({
        caseSensitive: false,
        wholeWords: false,
    });
    const [searchStatus, setSearchStatus] = useState<SearchStatus>({
        isSearching: false,
        hasError: false,
    });
    const searchInputRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const clearSearchResults = useCallback(() => {
        setTotalMatches(0);
        setCurrentMatchIndex(0);
        if (searchPluginInstance?.clearHighlights) {
            searchPluginInstance.clearHighlights();
        }
    }, [searchPluginInstance]);

    /**
     * Build a RegExp from the query and pass it directly to PDF.js highlight().
     *
     * This single strategy handles all real-world PDF text quirks:
     *   - single-line and multiline pasted queries
     *   - cross-span phrases separated by zero, one, or many characters
     *   - NBSP / Unicode spaces / soft hyphens (U+00AD) / hyphen line-breaks
     *   - case sensitivity and whole-word options
     *
     * No Rust fallback is needed: PDF.js native regex search covers every case
     * where the PDF has a searchable text layer (the only case that matters for
     * highlight rendering).
     */
    const executeSearch = useCallback(async (keyword: string, options: SearchOptions) => {
        if (!searchPluginInstance || !keyword.trim()) return;

        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        clearSearchResults();
        setSearchStatus({ isSearching: true, hasError: false });

        try {
            const { highlight } = searchPluginInstance;
            if (!highlight || typeof highlight !== 'function') {
                throw new Error('PDF search plugin highlight function is not available');
            }

            const trimmedKeyword = keyword.trim();
            if (!trimmedKeyword) {
                setSearchStatus({ isSearching: false, hasError: false });
                return;
            }

            const regex = buildSearchRegex(trimmedKeyword, {
                matchCase: options.caseSensitive,
                wholeWords: options.wholeWords,
            });

            if (regex) {
                let results;
                try {
                    results = await highlight(regex);
                } catch (err: any) {
                    console.warn('[Search] highlight error:', err);
                    results = null;
                }
                const count = results?.length ?? 0;
                if (count > 0) {
                    setTotalMatches(count);
                    setCurrentMatchIndex(0);
                    setSearchStatus({ isSearching: false, hasError: false });
                    searchPluginInstance.jumpToMatch?.(1);
                    return;
                }
            }

            setSearchStatus({ isSearching: false, hasError: false });
        } catch (error) {
            console.error('[Search] Unexpected error:', error);
            setSearchStatus({
                isSearching: false,
                hasError: true,
                errorMessage: 'Search failed. Please try again.',
            });
            clearSearchResults();
        }
    }, [searchPluginInstance, clearSearchResults]);

    const handleClearSearch = useCallback(() => {
        abortControllerRef.current?.abort();
        setSearchKeyword('');
        setShowSearch(false);
        clearSearchResults();
        setSearchStatus({ isSearching: false, hasError: false });
    }, [clearSearchResults]);

    const searchKeywordRef = useRef(searchKeyword);
    searchKeywordRef.current = searchKeyword;
    const searchOptionsRef = useRef(searchOptions);
    searchOptionsRef.current = searchOptions;
    const executeSearchRef = useRef(executeSearch);
    executeSearchRef.current = executeSearch;

    /** Stable identity: avoids PdfSearchBar debounce effect re-firing every time search state updates. */
    const handleSearch = useCallback(() => {
        const trimmedKeyword = searchKeywordRef.current.trim();
        if (trimmedKeyword) {
            executeSearchRef.current(trimmedKeyword, searchOptionsRef.current);
        }
    }, []);

    const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSearch();
        } else if (e.key === 'Escape') {
            handleClearSearch();
        }
    }, [handleSearch, handleClearSearch]);

    const handleNextMatch = useCallback(() => {
        if (!searchPluginInstance || totalMatches === 0) return;
        const nextIndex = (currentMatchIndex + 1) % totalMatches;
        setCurrentMatchIndex(nextIndex);
        searchPluginInstance.jumpToMatch?.(nextIndex + 1);
    }, [searchPluginInstance, totalMatches, currentMatchIndex]);

    const handlePreviousMatch = useCallback(() => {
        if (!searchPluginInstance || totalMatches === 0) return;
        const prevIndex = currentMatchIndex === 0 ? totalMatches - 1 : currentMatchIndex - 1;
        setCurrentMatchIndex(prevIndex);
        searchPluginInstance.jumpToMatch?.(prevIndex + 1);
    }, [searchPluginInstance, totalMatches, currentMatchIndex]);

    const handleToggleSearch = useCallback(() => {
        setShowSearch(prev => !prev);
    }, []);

    const handleInputBlur = useCallback(() => {
        if (!searchKeyword.trim()) {
            setShowSearch(false);
        }
    }, [searchKeyword]);

    const toggleCaseSensitive = useCallback(() => {
        const next = { ...searchOptions, caseSensitive: !searchOptions.caseSensitive };
        setSearchOptions(next);
        if (searchKeyword.trim()) executeSearch(searchKeyword, next);
    }, [searchKeyword, searchOptions, executeSearch]);

    const toggleWholeWords = useCallback(() => {
        const next = { ...searchOptions, wholeWords: !searchOptions.wholeWords };
        setSearchOptions(next);
        if (searchKeyword.trim()) executeSearch(searchKeyword, next);
    }, [searchKeyword, searchOptions, executeSearch]);

    // Keyboard shortcut: Ctrl+F / Cmd+F
    useKeyboardShortcuts({
        f: (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 0);
            }
        }
    });

    // Programmatic search via custom DOM event (used by AI / external callers)
    useEffect(() => {
        const handlePdfSearch = (event: CustomEvent) => {
            const { keyword, options } = event.detail;
            if (keyword) {
                executeSearch(keyword, options || searchOptions);
            } else {
                handleClearSearch();
            }
        };

        window.addEventListener('pdf-search', handlePdfSearch as EventListener);
        return () => {
            window.removeEventListener('pdf-search', handlePdfSearch as EventListener);
            abortControllerRef.current?.abort();
        };
    }, [searchOptions, executeSearch, handleClearSearch]);

    return {
        showSearch,
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
    };
}
