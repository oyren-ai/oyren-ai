import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { usePdfCache } from '@/features/pdf-viewer/hooks/usePdfCache';
import { useAppContext } from './AppContext';

interface PdfCacheContextType {
  loadPdf: (path: string) => Promise<string>;
  getCachedPdf: (path: string) => string | null;
  getZoomLevel: (path: string) => number;
  setZoomLevel: (path: string, zoom: number) => void;
  removePdf: (path: string) => void;
  clearCache: () => void;
  preloadAdjacentPdfs: (currentPath: string, allPaths: string[]) => void;
}

const PdfCacheContext = createContext<PdfCacheContextType | undefined>(undefined);

export function PdfCacheProvider({ children }: { children: ReactNode }) {
  const cache = usePdfCache();
  const { openPdfs } = useAppContext();
  const previousPathsRef = React.useRef<Set<string>>(new Set());

  // Clean up cache when tabs are closed
  useEffect(() => {
    const currentPaths = new Set(openPdfs.map(pdf => pdf.path));
    const previousPaths = previousPathsRef.current;

    // Find paths that were removed (closed tabs)
    previousPaths.forEach(path => {
      if (!currentPaths.has(path)) {
        cache.removePdf(path);
      }
    });

    previousPathsRef.current = currentPaths;
  }, [openPdfs, cache]);

  return (
    <PdfCacheContext.Provider value={cache}>
      {children}
    </PdfCacheContext.Provider>
  );
}

export function usePdfCacheContext(): PdfCacheContextType {
  const context = useContext(PdfCacheContext);
  if (!context) {
    throw new Error('usePdfCacheContext must be used within PdfCacheProvider');
  }
  return context;
}