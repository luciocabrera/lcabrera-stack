import { describe, expect, it } from 'vite-plus/test';

import { isNavigationPinned } from './isNavigationPinned.util';

describe('isNavigationPinned', () => {
  it('returns true when preference is "pinned"', () => {
    expect(
      isNavigationPinned({
        defaultIsPinned: false,
        navigationPinnedPreference: 'pinned',
      }),
    ).toBe(true);
  });

  it('returns false when preference is "unpinned"', () => {
    expect(
      isNavigationPinned({
        defaultIsPinned: true,
        navigationPinnedPreference: 'unpinned',
      }),
    ).toBe(false);
  });

  it('falls back to defaultIsPinned when preference is undefined', () => {
    expect(
      isNavigationPinned({
        defaultIsPinned: true,
        navigationPinnedPreference: undefined,
      }),
    ).toBe(true);

    expect(
      isNavigationPinned({
        defaultIsPinned: false,
        navigationPinnedPreference: undefined,
      }),
    ).toBe(false);
  });
});
