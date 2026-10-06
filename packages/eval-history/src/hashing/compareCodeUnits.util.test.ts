import { describe, expect, it } from 'vite-plus/test';

import { compareCodeUnits } from './compareCodeUnits.util.ts';

describe('compareCodeUnits', () => {
  it('orders by UTF-16 code unit, independent of locale', () => {
    expect(['b', 'a', 'B', 'ä', 'a/b', 'a'].toSorted(compareCodeUnits)).toEqual(
      ['B', 'a', 'a', 'a/b', 'b', 'ä'],
    );
  });

  it('returns zero for equal strings', () => {
    expect(compareCodeUnits('a', 'a')).toBe(0);
  });
});
