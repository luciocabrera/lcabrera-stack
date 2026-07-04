import { describe, expect, it } from 'vitest';

import { NAVIGATION_COLLAPSED_VALUES } from './globalSettings.constants';
import { isNavigationCollapsedPreference } from './isNavigationCollapsedPreference.util';

describe('isNavigationCollapsedPreference', () => {
  it.each(NAVIGATION_COLLAPSED_VALUES)('returns true for %s', (value) => {
    expect(isNavigationCollapsedPreference(value)).toBe(true);
  });

  it('returns false for unknown strings', () => {
    expect(isNavigationCollapsedPreference('open')).toBe(false);
    expect(isNavigationCollapsedPreference('')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isNavigationCollapsedPreference(undefined)).toBe(false);
    expect(isNavigationCollapsedPreference(null)).toBe(false);
    expect(isNavigationCollapsedPreference(true)).toBe(false);
    expect(isNavigationCollapsedPreference({})).toBe(false);
  });
});
