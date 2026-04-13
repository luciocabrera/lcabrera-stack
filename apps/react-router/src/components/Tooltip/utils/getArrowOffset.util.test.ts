import { describe, expect, it } from 'vitest';

import { getArrowOffset } from './getArrowOffset.util.ts';

describe('getArrowOffset', () => {
  it('computes the arrow offset correctly', () => {
    // triggerCenter - tooltipStart - HALF_ARROW (6)
    const result = getArrowOffset({
      placement: 'top',
      tooltipStart: 100,
      triggerCenter: 150,
    });
    expect(result).toBe(150 - 100 - 6); // = 44
  });

  it('returns negative offset when triggerCenter is less than tooltipStart + HALF_ARROW', () => {
    const result = getArrowOffset({
      placement: 'bottom',
      tooltipStart: 200,
      triggerCenter: 150,
    });
    expect(result).toBe(150 - 200 - 6); // = -56
  });
});
