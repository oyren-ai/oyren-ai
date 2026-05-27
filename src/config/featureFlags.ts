/**
 * Feature flags - Simple key-value configuration
 * Set to true to enable, false to disable
 */

export const featureFlags = {
  // Navigation tabs
  showHomeTab: true,
  showChatsTab: true,
  
  // Features
  enableDarkMode: true,
  enableAiChat: true,
  enablePdfHighlighting: true,

  // UI elements
  enableSidebarResize: true,
  enableCollapsiblePanels: true,
  enableContextMenu: true,
  enableSearchBar: true,
} as const;

// Type for feature flag keys
export type FeatureFlag = keyof typeof featureFlags;

// Helper to check if a feature is enabled
export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return featureFlags[flag];
};