import React from 'react';
import { Search } from 'lucide-react';

/**
 * Parse message content for keyword references in format [{kw:"keyword"}]
 * and replace them with clickable links
 */
export function parseMessageWithKeywords(content: string): React.ReactNode[] {
  // Regex to match [{kw:"..."}] pattern
  // Captures the keyword between quotes (including empty strings)
  const keywordRegex = /\[\{kw:"([^"]*)"\}\]/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;
  
  while ((match = keywordRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    
    // Extract the keyword
    const keyword = match[1];
    
    // Create clickable link component
    parts.push(
      <KeywordLink key={`kw-${keyIndex++}`} keyword={keyword} />
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text after the last match
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }
  
  // If no keywords found, return the original content
  if (parts.length === 0) {
    return [content];
  }
  
  return parts;
}

/**
 * Clickable keyword link component that triggers PDF search
 */
interface KeywordLinkProps {
  keyword: string;
}

export const KeywordLink: React.FC<KeywordLinkProps> = ({ keyword }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Dispatch custom event to trigger PDF search
    const searchEvent = new CustomEvent('pdf-search', {
      detail: { keyword }
    });
    window.dispatchEvent(searchEvent);
  };
  
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 
                 bg-blue-100 dark:bg-blue-900/30 
                 text-blue-700 dark:text-blue-300 
                 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/50 
                 transition-colors group"
      title={`Search PDF for "${keyword}"`}
    >
      <Search className="w-3 h-3 opacity-60 group-hover:opacity-100" />
      <span className="text-sm font-medium">{keyword}</span>
    </button>
  );
};

/**
 * Extract all keywords from a message for testing purposes
 */
export function extractKeywords(content: string): string[] {
  const keywordRegex = /\[\{kw:"([^"]*)"\}\]/g;
  const keywords: string[] = [];
  let match;
  
  while ((match = keywordRegex.exec(content)) !== null) {
    keywords.push(match[1]);
  }
  
  return keywords;
}