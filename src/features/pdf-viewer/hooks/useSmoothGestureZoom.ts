import { useEffect, useRef, useCallback } from 'react';
import { PlatformInfo } from '@/utils/platformDetection';
import { PDF_ZOOM_CONFIG } from '@/constants/pdfZoom';

interface UseSmoothGestureZoomProps {
  containerRef: React.RefObject<HTMLElement>;
  requestZoom: (scale: number, source?: string) => void;
  flushZoom: () => void;
  getCurrentScale: () => number;
  platform: PlatformInfo;
}

/**
 * Smooth gesture zoom for Safari (macOS trackpad pinch)
 * 
 * Key principles:
 * 1. Single source of truth for scale (via getCurrentScale)
 * 2. Baseline tracking to prevent error accumulation
 * 3. Uses coordinator for throttled commits (latest-wins)
 * 4. No duplicate listeners
 */
export function useSmoothGestureZoom({
  containerRef,
  requestZoom,
  flushZoom,
  getCurrentScale,
  platform,
}: UseSmoothGestureZoomProps) {
  // Baseline scale when gesture starts
  const gestureStartScaleRef = useRef<number>(1.0);

  // Last applied gesture scale to detect changes
  const lastGestureScaleRef = useRef<number>(1.0);

  // RAF handle
  const rafHandleRef = useRef<number | null>(null);

  // Gesture active flag
  const isGestureActiveRef = useRef<boolean>(false);

  /**
   * Schedule gesture zoom on RAF
   * Computes target scale and sends to coordinator
   */
  const scheduleGestureZoom = useCallback((scale: number) => {
    if (rafHandleRef.current !== null) {
      // Already scheduled - just update the scale request
      // Coordinator will handle latest-wins
      requestZoom(scale, 'gesture');
      return;
    }

    rafHandleRef.current = requestAnimationFrame(() => {
      rafHandleRef.current = null;
      // Send to coordinator (it will normalize and throttle)
      requestZoom(scale, 'gesture');
    });
  }, [requestZoom]);

  /**
   * Gesture start: Record baseline
   */
  const handleGestureStart = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();

    // Store baseline scale from single source of truth
    gestureStartScaleRef.current = getCurrentScale();
    lastGestureScaleRef.current = 1.0;
    isGestureActiveRef.current = true;
  }, [getCurrentScale]);

  /**
   * Gesture change: Calculate from baseline
   */
  const handleGestureChange = useCallback((e: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isGestureActiveRef.current) {
      return;
    }

    const gestureScale = e.scale;

    // Only update if change is significant
    if (Math.abs(gestureScale - lastGestureScaleRef.current) < PDF_ZOOM_CONFIG.GESTURE_THRESHOLD) {
      return;
    }

    // Calculate from baseline (prevents error accumulation)
    const newScale = gestureStartScaleRef.current * gestureScale;

    lastGestureScaleRef.current = gestureScale;

    // Schedule on RAF
    scheduleGestureZoom(newScale);
  }, [scheduleGestureZoom]);

  /**
   * Gesture end: Clean up and flush final zoom
   */
  const handleGestureEnd = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();

    isGestureActiveRef.current = false;

    // Cancel any pending RAF
    if (rafHandleRef.current !== null) {
      cancelAnimationFrame(rafHandleRef.current);
      rafHandleRef.current = null;
    }

    // Flush final zoom immediately (coordinator will commit latest value)
    flushZoom();

    // Update baseline for next gesture
    gestureStartScaleRef.current = getCurrentScale();
    lastGestureScaleRef.current = 1.0;
  }, [getCurrentScale, flushZoom]);

  /**
   * Attach gesture listeners (Safari only)
   */
  useEffect(() => {
    // Only on platforms with gesture events (Safari)
    if (!platform.hasGestureEvents) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Find the viewer element
    const viewer = container.querySelector('.rpv-core__viewer');
    if (!viewer) {
      return;
    }

    viewer.addEventListener('gesturestart', handleGestureStart);
    viewer.addEventListener('gesturechange', handleGestureChange);
    viewer.addEventListener('gestureend', handleGestureEnd);

    return () => {
      viewer.removeEventListener('gesturestart', handleGestureStart);
      viewer.removeEventListener('gesturechange', handleGestureChange);
      viewer.removeEventListener('gestureend', handleGestureEnd);

      // Cancel pending RAF
      if (rafHandleRef.current !== null) {
        cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = null;
      }

      // Reset state
      isGestureActiveRef.current = false;
    };
  }, [containerRef, platform, handleGestureStart, handleGestureChange, handleGestureEnd]);
}

