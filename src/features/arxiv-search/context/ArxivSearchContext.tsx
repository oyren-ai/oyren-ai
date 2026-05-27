import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { ArxivPaperMeta } from '@/api/types/ai';

interface ArxivSearchState {
  query: string;
  setQuery: (query: string) => void;
  results: ArxivPaperMeta[];
  setResults: (results: ArxivPaperMeta[]) => void;
  totalResults: number;
  setTotalResults: (total: number) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  hasSearched: boolean;
  setHasSearched: (searched: boolean) => void;
}

const ArxivSearchContext = createContext<ArxivSearchState | undefined>(undefined);

export const ArxivSearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArxivPaperMeta[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  return (
    <ArxivSearchContext.Provider value={{
      query, setQuery, results, setResults, totalResults, setTotalResults,
      isSearching, setIsSearching, error, setError, hasSearched, setHasSearched,
    }}>
      {children}
    </ArxivSearchContext.Provider>
  );
};

export const useArxivSearchContext = (): ArxivSearchState => {
  const context = useContext(ArxivSearchContext);
  if (!context) {
    throw new Error('useArxivSearchContext must be used within an ArxivSearchProvider');
  }
  return context;
};
