import { describe, expect, it } from 'vitest';

import { getTotalVisibleColumnCount } from './getTotalVisibleColumnCount.util.ts';

describe('getTotalVisibleColumnCount', () => {
  it('counts pinned columns, center columns, and both spacer cells', () => {
    const result = getTotalVisibleColumnCount({
      leftPinnedCount: 2,
      leftSpacerWidth: 40,
      rightPinnedCount: 1,
      rightSpacerWidth: 60,
      visibleCenterCount: 3,
    });

    expect(result).toBe(8);
  });

  it('does not count spacer cells when widths are zero', () => {
    const result = getTotalVisibleColumnCount({
      leftPinnedCount: 1,
      leftSpacerWidth: 0,
      rightPinnedCount: 1,
      rightSpacerWidth: 0,
      visibleCenterCount: 2,
    });

    expect(result).toBe(4);
  });

  it('returns zero when nothing is rendered', () => {
    const result = getTotalVisibleColumnCount({
      leftPinnedCount: 0,
      leftSpacerWidth: 0,
      rightPinnedCount: 0,
      rightSpacerWidth: 0,
      visibleCenterCount: 0,
    });

    expect(result).toBe(0);
  });
});
