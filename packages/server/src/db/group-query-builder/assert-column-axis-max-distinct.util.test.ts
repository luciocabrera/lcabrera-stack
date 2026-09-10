import { describe, expect, it } from 'vite-plus/test';

import { assertColumnAxisMaxDistinct } from './assert-column-axis-max-distinct.util.ts';

describe('assertColumnAxisMaxDistinct', () => {
  it('accepts a positive integer', () => {
    expect(() => assertColumnAxisMaxDistinct(1)).not.toThrow();
  });

  it('refuses a non-positive ceiling as a caller error', () => {
    expect(() => assertColumnAxisMaxDistinct(0)).toThrow('positive integer');
  });

  it('refuses a non-integer ceiling', () => {
    expect(() => assertColumnAxisMaxDistinct(1.5)).toThrow('positive integer');
  });
});
