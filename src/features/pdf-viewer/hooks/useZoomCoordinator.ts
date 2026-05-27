import { useRef, useCallback } from 'react';
import { PDF_ZOOM_CONFIG, normalizeZoomScale } from '@/constants/pdfZoom';

interface UseZoomCoordinatorProps {
  zoomTo: (scale: number) => void;
  throttleMs?: number;
}

/**
 * Zoom Coordinator Hook
 * 
 * Centralizes zoom requests with latest-wins coalescing and throttled commits.
 * This prevents infinite loops and reduces PDF re-render load during smooth zoom.
 * 
 * Key principles:
 * 1. Latest value wins - multiple rapid requests only keep the latest
 * 2. Throttled commits - applies zoomPlugin.zoomTo at controlled rate (~20fps)
 * 3. Immediate flush - buttons can flush immediately for instant feedback
 * 4. Normalized values - all scales are normalized before committing
 */
export function useZoomCoordinator({
  zoomTo,
  throttleMs = PDF_ZOOM_CONFIG.RATE_LIMIT_MS,
}: UseZoomCoordinatorProps) {
  // Latest pending scale request (latest-wins)
  const pendingScaleRef = useRef<number | null>(null);
  
  // Throttle timer handle
  const throttleTimerRef = useRef<number | null>(null);
  
  // Last commit time for throttling
  const lastCommitTimeRef = useRef<number>(0);

  /**
   * Internal: Commit the pending zoom to the plugin
   */
  const commitZoom = useCallback(() => {
    if (pendingScaleRef.current === null) {
      return;
    }

    const scaleToCommit = pendingScaleRef.current;
    pendingScaleRef.current = null;
    lastCommitTimeRef.current = Date.now();

    // Apply zoom to plugin (this is the ONLY place that calls zoomPlugin.zoomTo)
    zoomTo(scaleToCommit);
  }, [zoomTo]);

  /**
   * Request a zoom to a specific scale
   * This coalesces multiple requests - only the latest value is kept
   */
  const requestZoom = useCallback((scale: number, source?: string) => {
    // Normalize the scale immediately (clamp + precision)
    const normalizedScale = normalizeZoomScale(scale);
    
    // Store as latest request (overwrites any previous pending request)
    pendingScaleRef.current = normalizedScale;

    // If no throttle timer is active, schedule one
    if (throttleTimerRef.current === null) {
      const now = Date.now();
      const timeSinceLastCommit = now - lastCommitTimeRef.current;
      
      // If enough time has passed, commit immediately
      if (timeSinceLastCommit >= throttleMs) {
        commitZoom();
      } else {
        // Schedule commit after remaining throttle time
        const delay = throttleMs - timeSinceLastCommit;
        throttleTimerRef.current = window.setTimeout(() => {
          throttleTimerRef.current = null;
          commitZoom();
        }, delay);
      }
    }
    // If timer is already active, it will commit the latest value when it fires
  }, [throttleMs, commitZoom]);

  /**
   * Commit the pending zoom immediately
   * Used by buttons and gesture end to ensure final value is applied
   */
  const flushZoom = useCallback(() => {
    // Cancel any pending throttle timer
    if (throttleTimerRef.current !== null) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    
    // Commit immediately
    commitZoom();
  }, [commitZoom]);

  return {
    requestZoom,
    flushZoom,
  };
}

