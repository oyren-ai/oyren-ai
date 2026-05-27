import { useRef, useCallback, useEffect } from 'react';
import { detectPlatform, normalizeWheelDelta, isZoomModifierPressed } from '@/utils/platformDetection';
import { PDF_ZOOM_CONFIG, normalizeZoomScale } from '@/constants/pdfZoom';

interface UseSmoothPdfZoomProps {
  containerRef: React.RefObject<HTMLElement>;
  requestZoom: (scale: number, source?: string) => void;
  getCurrentScale: () => number;
}

/**
 * Zotero-level smooth zoom implementation
 * 
 * Key principles:
 * 1. Single source of truth for scale (via getCurrentScale)
 * 2. Single DOM wheel listener with capture phase
 * 3. Coalesce wheel deltas per animation frame
 * 4. No duplicate listeners or parallel scale states
 * 5. Proper event blocking (preventDefault + stopPropagation)
 * 6. Uses coordinator for throttled commits (latest-wins)
 */
export function useSmoothPdfZoom({
  containerRef,
  requestZoom,
  getCurrentScale,
}: UseSmoothPdfZoomProps) {
  // Detect platform once
  const platformRef = useRef(detectPlatform());

  // Accumulated delta for current animation frame
  const accumulatedDeltaRef = useRef<number>(0);

  // RAF handle for coalescing
  const rafHandleRef = useRef<number | null>(null);

  // Track if zoom is scheduled
  const isZoomScheduledRef = useRef<boolean>(false);

  /**
   * Apply accumulated zoom in animation frame
   * Computes target scale and sends to coordinator (latest-wins)
   */
  const applyZoom = useCallback(() => {
    isZoomScheduledRef.current = false;

    if (accumulatedDeltaRef.current === 0) {
      return;
    }

    // Get current scale from single source of truth
    const currentScale = getCurrentScale();

    // Calculate scale factor from accumulated delta
    const delta = accumulatedDeltaRef.current;
    accumulatedDeltaRef.current = 0; // Reset accumulator

    // Apply exponential scaling for smooth zoom
    // Using WHEEL_SENSITIVITY from constants
    const scaleFactor = Math.exp(-delta * PDF_ZOOM_CONFIG.WHEEL_SENSITIVITY);
    const newScale = currentScale * scaleFactor;

    // Send to coordinator (it will normalize and throttle)
    requestZoom(newScale, 'wheel');
  }, [getCurrentScale, requestZoom]);

  /**
   * Schedule zoom application on next animation frame
   */
  const scheduleZoom = useCallback(() => {
    if (isZoomScheduledRef.current) {
      return; // Already scheduled
    }

    isZoomScheduledRef.current = true;
    rafHandleRef.current = requestAnimationFrame(applyZoom);
  }, [applyZoom]);

  /**
   * Handle wheel events - coalesce deltas
   */
  const handleWheel = useCallback((e: WheelEvent) => {
    // Check if zoom modifier is pressed
    if (!isZoomModifierPressed(e, platformRef.current)) {
      return; // Let event bubble for scrolling
    }

    // Block browser zoom and viewer default zoom
    e.preventDefault();
    e.stopPropagation();

    // Normalize delta based on deltaMode and platform
    const normalizedDelta = normalizeWheelDelta(e, platformRef.current);

    // Convert to delta value (reverse the exponential for accumulation)
    const deltaValue = -Math.log(normalizedDelta) * 100;

    // Accumulate delta
    accumulatedDeltaRef.current += deltaValue;

    // Schedule zoom on next animation frame
    scheduleZoom();
  }, [scheduleZoom]);

  /**
   * Attach single DOM wheel listener with capture phase
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Attach listener in capture phase with { passive: false }
    // This ensures we can preventDefault() and block all default zoom behavior
    container.addEventListener('wheel', handleWheel, {
      capture: true,
      passive: false,
    });

    // Cleanup
    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });

      // Cancel any pending RAF
      if (rafHandleRef.current !== null) {
        cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = null;
      }

      // Reset state
      accumulatedDeltaRef.current = 0;
      isZoomScheduledRef.current = false;
    };
  }, [containerRef, handleWheel]);

  return {
    platform: platformRef.current,
  };
}

