import { describe, expect, it } from 'vite-plus/test';

import { getPinnedStyle } from './getPinnedStyle.util';

describe('getPinnedStyle', () => {
  // How an unpinned column arrives here: getPinnedColumnOffsets returns a
  // Partial<Record<…>> and only ever writes entries carrying a side, so an
  // unpinned key is absent from the map rather than present without a side.
  // That makes `undefined` the only shape the no-style branch can be reached
  // with — there is no valueless PinnedColumnInfo to test.
  it('returns undefined when the column is not pinned', () => {
    expect(getPinnedStyle(undefined)).toBeUndefined();
  });

  it('returns a style for left-pinned column', () => {
    const result = getPinnedStyle({
      isFirstPinnedRight: false,
      isLastPinnedLeft: false,
      offset: 100,
      side: 'left',
    });
    expect(result).toBeDefined();
  });

  it('returns a style for right-pinned column', () => {
    const result = getPinnedStyle({
      isFirstPinnedRight: false,
      isLastPinnedLeft: false,
      offset: 50,
      side: 'right',
    });
    expect(result).toBeDefined();
  });
});
