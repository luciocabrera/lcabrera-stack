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
        size: 'compact',
      }),
    ).toEqual({ collapsed: 'collapsed', size: 'compact' });
  });

  it('drops invalid fields independently', () => {
    expect(
      toGlobalNavigationPreferences({
        collapsed: 'collapsed',
        size: 7,
      }),
    ).toEqual({ collapsed: 'collapsed', size: undefined });
  });

  it('ignores a retired pinned slice left in an older cookie', () => {
    expect(
      toGlobalNavigationPreferences({ pinned: 'unpinned', size: 'compact' }),
    ).toEqual({ collapsed: undefined, size: 'compact' });
  });

  it('returns all-undefined preferences for an empty object', () => {
    expect(toGlobalNavigationPreferences({})).toEqual({
      collapsed: undefined,
      size: undefined,
    });
  });
});
