import { describe, expect, it } from 'vite-plus/test';

import { getLuminance } from './getLuminance.util';

describe('getLuminance', () => {
  it.each([
    { expected: 1, rgb: [1, 1, 1] as const },
    { expected: 0, rgb: [0, 0, 0] as const },
    { expected: 0.2126, rgb: [1, 0, 0] as const },
    { expected: 0.7152, rgb: [0, 1, 0] as const },
    { expected: 0.0722, rgb: [0, 0, 1] as const },
    { expected: 0.214041, rgb: [0.5, 0.5, 0.5] as const },
  ])('weighs $rgb as $expected', ({ expected, rgb }) => {
    expect(getLuminance(rgb)).toBeCloseTo(expected, 5);
  });
});
