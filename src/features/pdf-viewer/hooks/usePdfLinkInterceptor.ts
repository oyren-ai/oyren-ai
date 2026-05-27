import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isExternalUrl } from '../utils/urlUtils';

export function usePdfLinkInterceptor(
  viewerRef: React.RefObject<HTMLDivElement>,
  pdfUrl: string | null
) {
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (!pdfUrl || !viewerRef.current) return;

    const handleLinkClick = async (event: Event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a') as HTMLAnchorElement;
      
      if (link && link.href) {
        if (isExternalUrl(link.href)) {
          event.preventDefault();
          event.stopPropagation();
          
          try {
            await invoke('open_url_in_browser', { url: link.href });
          } catch (error) {
            try {
              await invoke('plugin:opener|open', { url: link.href });
            } catch (pluginError) {
              console.error('Failed to open link in browser:', error, pluginError);
            }
          }
        }
      }
    };

    const container = viewerRef.current;
    
    container.addEventListener('click', handleLinkClick, true);

    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            const links = element.querySelectorAll('a[href]');
            links.forEach((linkElement) => {
              const anchor = linkElement as HTMLAnchorElement;
              if (anchor.href && isExternalUrl(anchor.href)) {
                anchor.addEventListener('click', handleLinkClick, true);
              }
            });
            
            if (element.tagName === 'A' && element.getAttribute('href')) {
              const href = element.getAttribute('href');
              if (href && isExternalUrl(href)) {
                element.addEventListener('click', handleLinkClick, true);
              }
            }
          }
        });
      });
    });

    observerRef.current.observe(container, {
      childList: true,
      subtree: true,
    });

    return () => {
      container.removeEventListener('click', handleLinkClick, true);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [viewerRef, pdfUrl]);
}

