import React from 'react';
import type { ArxivPaperMeta } from '@/api/types/ai';
import ArxivPaperCard from '@/features/ai-chat/components/ArxivPaperCard';

interface ArxivSearchResultsProps {
  results: ArxivPaperMeta[];
  totalResults: number;
  onSave: (paper: ArxivPaperMeta) => void;
  savingPaperId: string | null;
  error: string | null;
}

const ArxivSearchResults: React.FC<ArxivSearchResultsProps> = ({
  results, totalResults, onSave, savingPaperId, error,
}) => {
  if (error) {
    return (
      <div className="px-3 py-4 text-center">
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="px-3 py-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No papers found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 pb-3" data-testid="arxiv-search-results">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Showing {results.length} of {totalResults} results
      </p>
      <div className="flex flex-col gap-2">
        {results.map((paper) => (
          <ArxivPaperCard
            key={paper.id}
            paper={paper}
            onSave={onSave}
            isSaving={savingPaperId === paper.id}
          />
        ))}
      </div>
    </div>
  );
};

export default ArxivSearchResults;