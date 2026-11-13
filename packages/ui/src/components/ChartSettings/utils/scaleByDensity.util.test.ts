import { describe, expect, it } from 'vite-plus/test';

import { scaleByDensity } from './scaleByDensity.util';

describe('scaleByDensity', () => {
  it('keeps the size at compact and scales it at every other level', () => {
    expect(
      (['dense', 'compact', 'comfortable', 'spacious'] as const).map(
        (density) => scaleByDensity({ density, size: 16 }),
      ),
    ).toEqual([10, 16, 22, 28]);
  });

  it('rounds a scaled size to a whole pixel', () => {
    expect(scaleByDensity({ density: 'comfortable', size: 240 })).toBe(330);
  });
});
