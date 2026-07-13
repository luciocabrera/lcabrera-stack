import { describe, expect, it, vi } from 'vitest';

import { getIsPopoverOpen } from './getIsPopoverOpen.util';

describe('getIsPopoverOpen', () => {
  it('queries the element with the :popover-open pseudo-class', () => {
    const matches = vi.fn(() => true);

    getIsPopoverOpen({ matches });

    expect(matches).toHaveBeenCalledWith(':popover-open');
  });

  it('returns true when the element matches', () => {
    expect(getIsPopoverOpen({ matches: () => true })).toBe(true);
  });

  it('returns false when the element does not match', () => {
    expect(getIsPopoverOpen({ matches: () => false })).toBe(false);
  });
});
