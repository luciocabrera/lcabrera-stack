import { describe, expect, it } from 'vitest';

import { NAVIGATION_SIZE_VALUES } from './globalSettings.constants';
import { isNavigationSizePreference } from './isNavigationSizePreference.util';

describe('isNavigationSizePreference', () => {
  it.each(NAVIGATION_SIZE_VALUES)('returns true for %s', (value) => {
    expect(isNavigationSizePreference(value)).toBe(true);
  });

  it('returns false for unknown strings', () => {
    expect(isNavigationSizePreference('huge')).toBe(false);
    expect(isNavigationSizePreference('')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isNavigationSizePreference(undefined)).toBe(false);
    expect(isNavigationSizePreference(null)).toBe(false);
    expect(isNavigationSizePreference(1)).toBe(false);
    expect(isNavigationSizePreference({})).toBe(false);
  });
});
