import React from 'react';
import { Sparkles } from 'lucide-react';

interface SnippetButtonProps {
  isActive: boolean;
  onClick: () => void;
}

const SnippetButton: React.FC<SnippetButtonProps> = ({ isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title="AI Snippet - Capture area to ask questions"
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all sm:text-sm ${
        isActive
          ? 'border-transparent bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
          : 'border-purple-400/60 bg-transparent text-purple-700 hover:bg-purple-500/10 dark:border-purple-500/50 dark:text-purple-200 dark:hover:bg-purple-950/50'
      }`}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      <span>AI Snippet</span>
    </button>
  );
};

export default SnippetButton;
