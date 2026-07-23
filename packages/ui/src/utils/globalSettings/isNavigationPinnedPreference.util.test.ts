import { describe, expect, it } from 'vite-plus/test';

import { NAVIGATION_PINNED_VALUES } from './globalSettings.constants';
import { isNavigationPinnedPreference } from './isNavigationPinnedPreference.util';

describe('isNavigationPinnedPreference', () => {
  it.each(NAVIGATION_PINNED_VALUES)('returns true for %s', (value) => {
    expect(isNavigationPinnedPreference(value)).toBe(true);
  });

  it('returns false for unknown strings', () => {
    expect(isNavigationPinnedPreference('floating')).toBe(false);
    expect(isNavigationPinnedPreference('')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isNavigationPinnedPreference(undefined)).toBe(false);
    expect(isNavigationPinnedPreference(0)).toBe(false);
    expect(isNavigationPinnedPreference([])).toBe(false);
  });
});
