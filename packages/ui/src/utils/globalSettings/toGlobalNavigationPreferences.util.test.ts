import { describe, expect, it } from 'vite-plus/test';

import { toGlobalNavigationPreferences } from './toGlobalNavigationPreferences.util';

describe('toGlobalNavigationPreferences', () => {
  it('returns undefined for non-object values', () => {
    expect(toGlobalNavigationPreferences(undefined)).toBeUndefined();
    expect(toGlobalNavigationPreferences('compact')).toBeUndefined();
    expect(toGlobalNavigationPreferences(1)).toBeUndefined();
  });

  it('parses a fully valid navigation slice', () => {
    expect(
      toGlobalNavigationPreferences({
        collapsed: 'collapsed',
        pinned: 'pinned',
        size: 'compact',
      }),
    ).toEqual({ collapsed: 'collapsed', pinned: 'pinned', size: 'compact' });
  });

  it('drops invalid fields independently', () => {
    expect(
      toGlobalNavigationPreferences({
        collapsed: 'open',
        pinned: 'pinned',
        size: 7,
      }),
    ).toEqual({ collapsed: undefined, pinned: 'pinned', size: undefined });
  });

  it('returns all-undefined preferences for an empty object', () => {
    expect(toGlobalNavigationPreferences({})).toEqual({
      collapsed: undefined,
      pinned: undefined,
      size: undefined,
    });
  });
});
