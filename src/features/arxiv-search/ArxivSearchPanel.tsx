import React from 'react';
import { useArxivSearch } from './hooks/useArxivSearch';
import { useSaveArxivPaper } from '@/features/ai-chat/hooks/useSaveArxivPaper';
import { useViewNavigation } from '@/contexts/NavigationContext';
import ArxivSearchPanelLayout from './ArxivSearchPanelLayout';

const ArxivSearchPanel: React.FC = () => {
  const { selectedWorkspace } = useViewNavigation();
  const {
    query, setQuery, results, totalResults,
    isSearching, error, hasSearched, executeSearch,
  } = useArxivSearch();
  const { savePaper, savingPaperId } = useSaveArxivPaper(selectedWorkspace?.id);

  return (
    <ArxivSearchPanelLayout
      query={query}
      onQueryChange={setQuery}
      onSearch={executeSearch}
      isSearching={isSearching}
      results={results}
      totalResults={totalResults}
      error={error}
      hasSearched={hasSearched}
      onSave={savePaper}
      savingPaperId={savingPaperId}
    />
  );
};

export default ArxivSearchPanel;