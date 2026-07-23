import { describe, expect, it } from 'vite-plus/test';

import { getPinnedStyle } from './getPinnedStyle.util';

describe('getPinnedStyle', () => {
  it('returns undefined when pinInfo is undefined', () => {
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

  it('returns undefined for unpinned column (no side)', () => {
    // @ts-expect-error testing no side
    const result = getPinnedStyle({
      isFirstPinnedRight: false,
      isLastPinnedLeft: false,
      offset: 0,
    });
    expect(result).toBeUndefined();
  });
});
