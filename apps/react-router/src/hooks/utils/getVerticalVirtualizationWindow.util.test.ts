import { describe, expect, it } from 'vitest';

import { getVerticalVirtualizationWindow } from './getVerticalVirtualizationWindow.util';

describe('getVerticalVirtualizationWindow', () => {
  it('calculates the visible window with overscan', () => {
    const result = getVerticalVirtualizationWindow({
      containerHeight: 100,
      itemHeight: 20,
      overscan: 2,
      scrollTop: 120,
      totalItems: 20,
    });

    expect(result).toEqual({
      bottomSpacerHeight: 140,
      endIndex: 13,
      offsetY: 80,
      startIndex: 4,
      totalHeight: 400,
      visibleCount: 5,
    });
  });

  it('clamps the window when scroll starts before the first item', () => {
    const result = getVerticalVirtualizationWindow({
      containerHeight: 90,
      itemHeight: 30,
      overscan: 3,
      scrollTop: 10,
      totalItems: 4,
    });

    expect(result).toEqual({
      bottomSpacerHeight: 0,
      endIndex: 4,
      offsetY: 0,
      startIndex: 0,
      totalHeight: 120,
      visibleCount: 3,
    });
  });
});
