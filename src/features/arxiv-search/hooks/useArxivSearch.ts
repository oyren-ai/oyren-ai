import { useCallback } from 'react';
import { searchArxiv } from '../services/arxivSearchService';
import { useArxivSearchContext } from '../context/ArxivSearchContext';

export function useArxivSearch() {
  const {
    query, setQuery, results, setResults, totalResults, setTotalResults,
    isSearching, setIsSearching, error, setError, hasSearched, setHasSearched,
  } = useArxivSearchContext();

  const executeSearch = useCallback(async (searchQuery?: string) => {
    const effectiveQuery = searchQuery ?? query;
    if (!effectiveQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await searchArxiv(effectiveQuery.trim());
      setResults(result.papers);
      setTotalResults(result.totalResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  }, [query, setResults, setTotalResults, setIsSearching, setError, setHasSearched]);

  return {
    query, setQuery, results, totalResults,
    isSearching, error, hasSearched, executeSearch,
  };
}