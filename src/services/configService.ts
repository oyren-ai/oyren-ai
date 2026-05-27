/**
 * Configuration Service
 * Manages UI settings and configuration persistence
 */

export interface AppConfig {
  ui: {
    darkMode: boolean;
    sidebarWidth: number;
    notesHeight: number;
  };
  privacy: {
    shareAnalytics: boolean;
    saveConversations: boolean;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  ui: {
    darkMode: true,
    sidebarWidth: 400,
    notesHeight: 300
  },
  privacy: {
    shareAnalytics: false,
    saveConversations: true
  }
};

class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig;
  private readonly CONFIG_KEY = 'oyren-ai-config';

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          ui: {
            ...DEFAULT_CONFIG.ui,
            ...parsed.ui
          },
          privacy: {
            ...DEFAULT_CONFIG.privacy,
            ...parsed.privacy
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = {
      ...this.config,
      ...updates
    };
    this.saveConfig();
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }

  /**
   * Export configuration
   */
  exportConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Import configuration
   */
  importConfig(config: Partial<AppConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    this.saveConfig();
  }

  /**
   * Get UI settings
   */
  getUiSettings(): AppConfig['ui'] {
    return { ...this.config.ui };
  }

  /**
   * Update UI settings
   */
  updateUiSettings(settings: Partial<AppConfig['ui']>): void {
    this.config.ui = {
      ...this.config.ui,
      ...settings
    };
    this.saveConfig();
  }

  /**
   * Get privacy settings
   */
  getPrivacySettings(): AppConfig['privacy'] {
    return { ...this.config.privacy };
  }

  /**
   * Update privacy settings
   */
  updatePrivacySettings(settings: Partial<AppConfig['privacy']>): void {
    this.config.privacy = {
      ...this.config.privacy,
      ...settings
    };
    this.saveConfig();
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();
export default configService;