import { describe, expect, it } from 'vite-plus/test';

import { formatPercent } from './formatPercent.util.ts';

describe('formatPercent', () => {
  it.each([
    { fraction: 0, printed: '0.0%' },
    { fraction: 2 / 3, printed: '66.7%' },
    { fraction: 1, printed: '100.0%' },
  ])('prints $fraction as $printed', ({ fraction, printed }) => {
    expect(formatPercent(fraction)).toBe(printed);
  });
});
