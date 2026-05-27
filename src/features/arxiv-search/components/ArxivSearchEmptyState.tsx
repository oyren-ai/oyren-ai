import React from 'react';
import { BookOpen } from 'lucide-react';

const ArxivSearchEmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3" data-testid="arxiv-empty-state">
    <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500" />
    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
      Search ArXiv Papers
    </h3>
    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px]">
      Enter a query above to search for academic papers on ArXiv.
    </p>
  </div>
);

export default ArxivSearchEmptyState;
