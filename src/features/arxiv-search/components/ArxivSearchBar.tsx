import React, { type FormEvent } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ArxivSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
}

const ArxivSearchBar: React.FC<ArxivSearchBarProps> = ({
  query, onQueryChange, onSearch, isSearching,
}) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5 px-3 py-2">
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search ArXiv papers..."
        className="h-8 text-sm"
        disabled={isSearching}
        data-testid="arxiv-search-input"
      />
      <Button
        type="submit"
        size="icon"
        variant="default"
        className="h-8 w-8 shrink-0"
        disabled={isSearching || !query.trim()}
        data-testid="arxiv-search-button"
      >
        {isSearching
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Search className="w-4 h-4" />
        }
      </Button>
    </form>
  );
};

export default ArxivSearchBar;