import { describe, expect, it } from 'vite-plus/test';

import { getPinnedStyle } from './getPinnedStyle.util';

describe('getPinnedStyle', () => {
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
