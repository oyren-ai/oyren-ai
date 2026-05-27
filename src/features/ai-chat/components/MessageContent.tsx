import React, { useEffect, useRef } from 'react';
import MdxRenderer from '@/components/common/MdxRenderer';

interface MessageContentProps {
  content: string;
  type: 'user' | 'assistant';
  messageId: string;
}

/**
 * Component to render message content with keyword links
 * Uses double curly brace syntax {{text}} - won't conflict with HTML/React
 * Example: "Check the {{methodology}} section for details"
 */
const MessageContent: React.FC<MessageContentProps> = ({ content, type, messageId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (type === 'assistant' && containerRef.current) {
      // Find all {{text}} patterns in the rendered HTML and make them clickable
      const textNodes: Node[] = [];
      const walker = document.createTreeWalker(
        containerRef.current,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip code blocks
            const parent = node.parentElement;
            if (parent?.tagName === 'CODE' || parent?.tagName === 'PRE') {
              return NodeFilter.FILTER_REJECT;
            }
            // Check if text contains our {{text}} pattern
            const text = node.textContent || '';
            if (text.includes('{{') && text.includes('}}')) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      // Collect all text nodes that need processing
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      
      // Process each text node
      textNodes.forEach(textNode => {
        const text = textNode.textContent || '';
        const regex = /\{\{([^}]+)\}\}/g;
        
        if (regex.test(text)) {
          const parent = textNode.parentNode;
          if (!parent) return;
          
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;
          let match;
          
          // Reset regex for actual replacement
          regex.lastIndex = 0;
          
          while ((match = regex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              fragment.appendChild(
                document.createTextNode(text.substring(lastIndex, match.index))
              );
            }
            
            // Create keyword button
            const keyword = match[1];
            const button = document.createElement('button');
            button.className = 'inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors';
            button.title = `Search for "${keyword}"`;
            button.onclick = (e) => {
              e.preventDefault();
              console.log('🔍 Searching for:', keyword);
              
              // Dispatch event for PDF search plugin
              window.dispatchEvent(new CustomEvent('pdf-search', {
                detail: { keyword }
              }));
            };
            
            // Add search icon using Unicode
            const icon = document.createElement('span');
            icon.textContent = '🔍';
            icon.className = 'text-xs';
            
            const textSpan = document.createElement('span');
            textSpan.textContent = keyword;
            textSpan.className = 'text-sm font-medium';
            
            button.appendChild(icon);
            button.appendChild(textSpan);
            fragment.appendChild(button);
            
            lastIndex = match.index + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            fragment.appendChild(
              document.createTextNode(text.substring(lastIndex))
            );
          }
          
          // Replace the text node with our fragment
          parent.replaceChild(fragment, textNode);
        }
      });
    }
  }, [content, type]);
  
  if (type === 'user') {
    // User messages are rendered as plain text
    return <div>{content}</div>;
  }
  
  // For assistant messages, render with MdxRenderer and process keywords after
  return (
    <div ref={containerRef}>
      <MdxRenderer content={content} />
    </div>
  );
};

export default MessageContent;