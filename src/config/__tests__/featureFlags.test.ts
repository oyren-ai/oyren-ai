import { describe, it, expect } from 'vitest';
import { featureFlags, isFeatureEnabled } from '../featureFlags';

describe('Feature Flags', () => {
  it('should have boolean values for all flags', () => {
    Object.values(featureFlags).forEach(value => {
      expect(typeof value).toBe('boolean');
    });
  });

  it('should have tab flags', () => {
    expect(featureFlags).toHaveProperty('showHomeTab');
    expect(featureFlags).toHaveProperty('showChatsTab');
  });

  it('should have feature flags', () => {
    expect(featureFlags).toHaveProperty('enableDarkMode');
    expect(featureFlags).toHaveProperty('enableAiChat');
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      // Test with a flag we know is true
      expect(isFeatureEnabled('showHomeTab')).toBe(true);
      expect(isFeatureEnabled('enableDarkMode')).toBe(true);
    });

  });
});