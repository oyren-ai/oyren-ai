/**
 * Platform Detection Utilities
 * Based on Zotero's cross-platform handling approach
 */

export interface PlatformInfo {
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  isTouchDevice: boolean;
  hasGestureEvents: boolean;
}

/**
 * Detect the current platform
 */
export function detectPlatform(): PlatformInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();

  return {
    isMac: /mac|darwin/.test(platform) || /macintosh/.test(userAgent),
    isWindows: /win/.test(platform) || /windows/.test(userAgent),
    isLinux: /linux/.test(platform) || /linux/.test(userAgent),
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasGestureEvents: 'ongesturestart' in window, // Safari-specific
  };
}

/**
 * Get the platform-specific zoom divisor.
 * Larger divisor = less sensitive. Tuned per platform's typical deltaY ranges.
 */
function zoomDivisor(platform: PlatformInfo): number {
  if (platform.isMac) return 200;
  if (platform.isWindows) return 300;
  return 250;
}

/**
 * Normalize wheel event delta based on deltaMode.
 * Returns a scale factor: <1 = zoom out, >1 = zoom in, 1 = no change.
 */
export function normalizeWheelDelta(event: WheelEvent, platform: PlatformInfo): number {
  let delta = event.deltaY;

  switch (event.deltaMode) {
    case WheelEvent.DOM_DELTA_LINE:
      delta *= 8;
      break;
    case WheelEvent.DOM_DELTA_PAGE:
      delta *= 24;
      break;
    default: // DOM_DELTA_PIXEL
      break;
  }

  return Math.pow(2, -delta / zoomDivisor(platform));
}

/**
 * Check if the modifier key for zoom is pressed
 * Cmd on Mac, Ctrl on Windows/Linux
 */
export function isZoomModifierPressed(event: KeyboardEvent | WheelEvent | MouseEvent, platform: PlatformInfo): boolean {
  if (platform.isMac) {
    return event.metaKey;
  }
  return event.ctrlKey;
}

