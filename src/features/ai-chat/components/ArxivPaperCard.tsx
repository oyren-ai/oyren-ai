import React, { useState } from 'react';
import { ExternalLink, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { browserApi } from '@/api/browserApi';
import type { ArxivPaperMeta } from '@/api/types/ai';

interface ArxivPaperCardProps {
  paper: ArxivPaperMeta;
  onSave?: (paper: ArxivPaperMeta) => void;
  isSaving?: boolean;
}

const ArxivPaperCard: React.FC<ArxivPaperCardProps> = ({ paper, onSave, isSaving }) => {
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);

  const authorsDisplay = paper.authors.length > 3
    ? `${paper.authors.slice(0, 3).join(', ')} +${paper.authors.length - 3} more`
    : paper.authors.join(', ');

  const publishedDate = formatDate(paper.published);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-800/30" data-testid={`arxiv-paper-card-${paper.id}`}>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-1">
        {paper.title}
      </h4>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
        {authorsDisplay}
      </p>
      <p className={`text-xs text-gray-600 dark:text-gray-400 mb-1 ${isAbstractExpanded ? '' : 'line-clamp-3 overflow-hidden'}`}>
        {paper.summary}
      </p>
      {paper.summary.length > 150 && (
        <button
          onClick={() => setIsAbstractExpanded(!isAbstractExpanded)}
          className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 hover:underline mb-2"
        >
          {isAbstractExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {isAbstractExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{publishedDate}</span>
        <div className="flex gap-1.5">
          <Button
            size="sm" variant="ghost"
            className="h-7 text-xs gap-1 text-blue-600 dark:text-blue-400"
            onClick={async () => browserApi.openUrl(paper.arxiv_url)}
          >
            <ExternalLink className="w-3 h-3" /> ArXiv
          </Button>
          {onSave && (
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs gap-1 border-gray-300 dark:border-gray-600"
              onClick={() => onSave(paper)} disabled={isSaving}
              data-testid={`arxiv-save-button-${paper.id}`}
            >
              <Download className="w-3 h-3" /> Save PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default ArxivPaperCard;
