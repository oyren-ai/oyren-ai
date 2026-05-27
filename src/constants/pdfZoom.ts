/**
 * PDF Zoom Configuration Constants
 * 
 * Centralized configuration for all zoom-related functionality.
 * This ensures consistency across all zoom implementations.
 */
export const PDF_ZOOM_CONFIG = {
  /** Minimum zoom scale (50%) */
  MIN_SCALE: 0.5,
  
  /** Maximum zoom scale (300%) */
  MAX_SCALE: 3.0,
  
  /** Step size for button-based zoom increments */
  STEP_SIZE: 0.2,
  
  /** Decimal precision for scale values (prevents floating-point drift) */
  PRECISION: 3,
  
  /** Wheel zoom sensitivity factor (used in exponential scaling) */
  WHEEL_SENSITIVITY: 0.01,
  
  /** Minimum gesture scale change threshold to trigger zoom update */
  GESTURE_THRESHOLD: 0.02,
  
  /** Debounce delay for zoom updates (milliseconds) */
  DEBOUNCE_MS: 50,
  
  /** Rate limit for zoom updates (milliseconds, ~60fps) */
  RATE_LIMIT_MS: 16,
} as const;

/**
 * Normalize a zoom scale value to the configured bounds and precision
 */
export function normalizeZoomScale(scale: number): number {
  const clamped = Math.max(
    PDF_ZOOM_CONFIG.MIN_SCALE,
    Math.min(PDF_ZOOM_CONFIG.MAX_SCALE, scale)
  );
  
  // Round to prevent floating-point drift
  return (
    Math.round(clamped * Math.pow(10, PDF_ZOOM_CONFIG.PRECISION)) /
    Math.pow(10, PDF_ZOOM_CONFIG.PRECISION)
  );
}

/**
 * Check if a scale value is at the minimum bound
 */
export function isMinScale(scale: number): boolean {
  return scale <= PDF_ZOOM_CONFIG.MIN_SCALE;
}

/**
 * Check if a scale value is at the maximum bound
 */
export function isMaxScale(scale: number): boolean {
  return scale >= PDF_ZOOM_CONFIG.MAX_SCALE;
}

/**
 * Check if a scale value is within bounds
 */
export function isScaleInBounds(scale: number): boolean {
  return (
    scale >= PDF_ZOOM_CONFIG.MIN_SCALE &&
    scale <= PDF_ZOOM_CONFIG.MAX_SCALE
  );
}

