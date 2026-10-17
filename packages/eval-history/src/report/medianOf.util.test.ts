import { describe, expect, it } from 'vite-plus/test';

import { medianOf } from './medianOf.util.ts';

describe('medianOf', () => {
  it('returns undefined for no values', () => {
    expect(medianOf([])).toBeUndefined();
  });

  it('takes the middle value of an odd count, in any order', () => {
    expect(medianOf([30, 10, 20])).toBe(20);
  });

  it('averages the two middle values of an even count', () => {
    expect(medianOf([40, 10, 30, 20])).toBe(25);
  });
});
