import { useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface CachedPdf {
  data: Uint8Array;
  url: string;
  zoom: number;
}

interface PdfCacheReturn {
  loadPdf: (path: string) => Promise<string>;
  getCachedPdf: (path: string) => string | null;
  getZoomLevel: (path: string) => number;
  setZoomLevel: (path: string, zoom: number) => void;
  removePdf: (path: string) => void;
  clearCache: () => void;
  preloadAdjacentPdfs: (currentPath: string, allPaths: string[]) => void;
}

export function usePdfCache(): PdfCacheReturn {
  const cacheRef = useRef<Map<string, CachedPdf>>(new Map());
  const loadingRef = useRef<Map<string, Promise<string>>>(new Map());

  const loadPdf = useCallback(async (path: string): Promise<string> => {
    // Check if already cached
    const cached = cacheRef.current.get(path);
    if (cached) {
      return cached.url;
    }

    // Check if already loading
    const loading = loadingRef.current.get(path);
    if (loading) {
      return loading;
    }

    // Start loading
    const loadPromise = (async () => {
      try {
        const data = await invoke<number[]>('read_pdf_file', { filepath: path });
        const uint8Array = new Uint8Array(data);
        const blob = new Blob([uint8Array], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        cacheRef.current.set(path, { data: uint8Array, url, zoom: 1 });
        loadingRef.current.delete(path);

        return url;
      } catch (error) {
        loadingRef.current.delete(path);
        throw error;
      }
    })();

    loadingRef.current.set(path, loadPromise);
    return loadPromise;
  }, []);

  const getCachedPdf = useCallback((path: string): string | null => {
    const cached = cacheRef.current.get(path);
    return cached?.url ?? null;
  }, []);

  const removePdf = useCallback((path: string): void => {
    const cached = cacheRef.current.get(path);
    if (cached) {
      URL.revokeObjectURL(cached.url);
      cacheRef.current.delete(path);
    }
  }, []);

  const getZoomLevel = useCallback((path: string): number => {
    const cached = cacheRef.current.get(path);
    return cached?.zoom ?? 1;
  }, []);

  const setZoomLevel = useCallback((path: string, zoom: number): void => {
    const cached = cacheRef.current.get(path);
    if (cached) {
      cached.zoom = zoom;
    }
  }, []);

  const clearCache = useCallback((): void => {
    cacheRef.current.forEach((cached) => {
      URL.revokeObjectURL(cached.url);
    });
    cacheRef.current.clear();
    loadingRef.current.clear();
  }, []);

  // Smart preloading: load adjacent tabs in background for instant switching
  const preloadAdjacentPdfs = useCallback((currentPath: string, allPaths: string[]): void => {
    const currentIndex = allPaths.indexOf(currentPath);
    if (currentIndex === -1) return;

    // Preload previous tab (if exists and not already cached/loading)
    if (currentIndex > 0) {
      const prevPath = allPaths[currentIndex - 1];
      if (!cacheRef.current.has(prevPath) && !loadingRef.current.has(prevPath)) {
        loadPdf(prevPath).catch(err => {
          console.warn('PdfCache: Failed to preload previous tab:', err);
        });
      }
    }

    // Preload next tab (if exists and not already cached/loading)
    if (currentIndex < allPaths.length - 1) {
      const nextPath = allPaths[currentIndex + 1];
      if (!cacheRef.current.has(nextPath) && !loadingRef.current.has(nextPath)) {
        loadPdf(nextPath).catch(err => {
          console.warn('PdfCache: Failed to preload next tab:', err);
        });
      }
    }
  }, [loadPdf]);

  return {
    loadPdf,
    getCachedPdf,
    getZoomLevel,
    setZoomLevel,
    removePdf,
    clearCache,
    preloadAdjacentPdfs,
  };
}