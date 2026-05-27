import React from 'react';
import { BookOpen } from 'lucide-react';
import ArxivPaperCard from './ArxivPaperCard';
import type { ArxivPaperMeta } from '@/api/types/ai';

interface ArxivPapersListProps {
  papers: ArxivPaperMeta[];
  onSavePaper?: (paper: ArxivPaperMeta) => void;
  savingPaperId?: string | null;
}

const ArxivPapersList: React.FC<ArxivPapersListProps> = ({ papers, onSavePaper, savingPaperId }) => {
  if (!papers || papers.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
        <BookOpen className="w-3.5 h-3.5" />
        <span>Found {papers.length} relevant paper{papers.length !== 1 ? 's' : ''}:</span>
      </div>
      <div className="space-y-2">
        {papers.map((paper) => (
          <ArxivPaperCard
            key={paper.id}
            paper={paper}
            onSave={onSavePaper}
            isSaving={savingPaperId === paper.id}
          />
        ))}
      </div>
    </div>
  );
};

export default ArxivPapersList;
