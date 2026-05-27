import React, { useEffect, useRef } from 'react';
import MdxRenderer from './MdxRenderer';
import { Search } from 'lucide-react';

interface MdxRendererWithKeywordsProps {
  content: string;
  className?: string;
}

/**
 * Wrapper around MdxRenderer that post-processes the rendered content
 * to replace [{kw:"..."}] patterns with clickable keyword buttons
 */
const MdxRendererWithKeywords: React.FC<MdxRendererWithKeywordsProps> = ({ content, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Find all text nodes in the rendered content
    const processTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const keywordPattern = /\[\{kw:"([^"]*)"\}\]/g;
        
        // Check if this text node contains keyword patterns
        if (keywordPattern.test(text)) {
          const span = document.createElement('span');
          let lastIndex = 0;
          let match;
          
          // Reset regex for actual replacement
          keywordPattern.lastIndex = 0;
          
          while ((match = keywordPattern.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              span.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
            }
            
            // Create keyword button
            const keyword = match[1];
            const button = document.createElement('button');
            button.className = 'inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors group';
            button.title = `Search PDF for "${keyword}"`;
            button.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Dispatch custom event to trigger PDF search
              const searchEvent = new CustomEvent('pdf-search', {
                detail: { keyword }
              });
              window.dispatchEvent(searchEvent);
              
  
              
              // Also try to update the search input if it exists
              const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]') as HTMLInputElement;
              if (searchInput) {
                searchInput.value = keyword;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                searchInput.dispatchEvent(new Event('change', { bubbles: true }));
                // Try to trigger search
                const searchButton = searchInput.parentElement?.querySelector('button');
                if (searchButton) {
                  searchButton.click();
                }
              }
            };
            
            // Add search icon
            const icon = document.createElement('svg');
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-60 group-hover:opacity-100"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>';
            icon.className = 'w-3 h-3';
            
            // Add keyword text
            const textSpan = document.createElement('span');
            textSpan.className = 'text-sm font-medium';
            textSpan.textContent = keyword;
            
            button.appendChild(icon.firstChild as Node);
            button.appendChild(textSpan);
            span.appendChild(button);
            
            lastIndex = match.index + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            span.appendChild(document.createTextNode(text.substring(lastIndex)));
          }
          
          // Replace the text node with our new span
          if (node.parentNode) {
            node.parentNode.replaceChild(span, node);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip code blocks and pre elements
        const element = node as HTMLElement;
        if (element.tagName !== 'CODE' && element.tagName !== 'PRE' && element.tagName !== 'SCRIPT') {
          // Process child nodes (create a copy of childNodes to avoid modification during iteration)
          const childNodes = Array.from(node.childNodes);
          childNodes.forEach(child => processTextNodes(child));
        }
      }
    };
    
    // Process all text nodes in the container
    processTextNodes(containerRef.current);
  }, [content]);
  
  return (
    <div ref={containerRef}>
      <MdxRenderer content={content} className={className} />
    </div>
  );
};

export default MdxRendererWithKeywords;