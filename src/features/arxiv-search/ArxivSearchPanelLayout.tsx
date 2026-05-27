import React from 'react';
import { BookOpen } from 'lucide-react';
import type { ArxivPaperMeta } from '@/api/types/ai';
import ArxivSearchBar from './components/ArxivSearchBar';
import ArxivSearchResults from './components/ArxivSearchResults';
import ArxivSearchEmptyState from './components/ArxivSearchEmptyState';
import ArxivSearchSkeleton from './components/ArxivSearchSkeleton';

interface ArxivSearchPanelLayoutProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  results: ArxivPaperMeta[];
  totalResults: number;
  error: string | null;
  hasSearched: boolean;
  onSave: (paper: ArxivPaperMeta) => void;
  savingPaperId: string | null;
}

const ArxivSearchPanelLayout: React.FC<ArxivSearchPanelLayoutProps> = ({
  query, onQueryChange, onSearch, isSearching,
  results, totalResults, error, hasSearched, onSave, savingPaperId,
}) => (
  <div className="flex flex-col h-full" data-testid="arxiv-search-panel">
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
      <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">ArXiv Search</h2>
    </div>
    <ArxivSearchBar
      query={query}
      onQueryChange={onQueryChange}
      onSearch={onSearch}
      isSearching={isSearching}
    />
    {isSearching ? (
      <ArxivSearchSkeleton />
    ) : hasSearched ? (
      <ArxivSearchResults
        results={results}
        totalResults={totalResults}
        onSave={onSave}
        savingPaperId={savingPaperId}
        error={error}
      />
    ) : (
      <ArxivSearchEmptyState />
    )}
  </div>
);

export default ArxivSearchPanelLayout;