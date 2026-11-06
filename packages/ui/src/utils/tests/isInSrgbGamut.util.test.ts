import { describe, expect, it } from 'vite-plus/test';

import { isInSrgbGamut } from './isInSrgbGamut.util';

describe('isInSrgbGamut', () => {
  it.each(['oklch(53% 0.01 250)', 'oklch(0% 0 0 / 0.5)', 'lab(100 0 0)'])(
    'accepts %s',
    (value) => {
      expect(isInSrgbGamut(value)).toBe(true);
    },
  );

  it.each(['oklch(85% 0.08 266)', 'lab(53 0.01 250)', 'oklch(38% 0.09 160)'])(
    'refuses %s, whose channel lies outside 0 to 1',
    (value) => {
      expect(isInSrgbGamut(value)).toBe(false);
    },
  );
});
