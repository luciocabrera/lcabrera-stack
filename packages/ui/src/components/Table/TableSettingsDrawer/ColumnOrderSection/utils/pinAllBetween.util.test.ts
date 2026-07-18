import { describe, expect, it } from 'vitest';

import { pinAllBetween } from './pinAllBetween.util';

describe('pinAllBetween', () => {
  it('pins all columns up to index on left side', () => {
    const result = pinAllBetween({
      allOrderedKeys: ['a', 'b', 'c', 'd'],
      columnPinning: { left: ['a'], right: ['d'] },
      index: 2,
      side: 'left',
    });

    expect(result.left).toEqual(['a', 'b', 'c']);
    expect(result.right).toEqual(['d']);
  });

  it('pins all columns from index on right side', () => {
    const result = pinAllBetween({
      allOrderedKeys: ['a', 'b', 'c', 'd'],
      columnPinning: { left: ['a'], right: ['d'] },
      index: 1,
      side: 'right',
    });

    expect(result.left).toEqual(['a']);
    expect(result.right).toEqual(['d', 'b', 'c']);
  });

  it('removes keys from opposite side while pinning', () => {
    const result = pinAllBetween({
      allOrderedKeys: ['a', 'b', 'c', 'd'],
      columnPinning: { left: ['a', 'c'], right: ['b', 'd'] },
      index: 2,
      side: 'left',
    });

    expect(result.left).toEqual(['a', 'c', 'b']);
    expect(result.right).toEqual(['d']);
  });
});
