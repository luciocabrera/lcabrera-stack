import { describe, expect, it } from 'vitest';

import { getHasPinOrderConflict } from './getHasPinOrderConflict.util';

describe('getHasPinOrderConflict', () => {
  it('returns false when there are no pinned columns', () => {
    expect(
      getHasPinOrderConflict({
        columnPinning: { left: [], right: [] },
        newOrder: ['a', 'b', 'c'],
      }),
    ).toBe(false);
  });

  it('returns false when left-pinned columns are at the start', () => {
    expect(
      getHasPinOrderConflict({
        columnPinning: { left: ['a', 'b'], right: [] },
        newOrder: ['a', 'b', 'c', 'd'],
      }),
    ).toBe(false);
  });

  it('returns true when a left-pinned column is not at the start', () => {
    expect(
      getHasPinOrderConflict({
        columnPinning: { left: ['a', 'b'], right: [] },
        newOrder: ['a', 'c', 'b', 'd'],
      }),
    ).toBe(true);
  });

  it('returns false when right-pinned columns are at the end', () => {
    expect(
      getHasPinOrderConflict({
        columnPinning: { left: [], right: ['c', 'd'] },
        newOrder: ['a', 'b', 'c', 'd'],
      }),
    ).toBe(false);
  });

  it('returns true when a right-pinned column is not at the end', () => {
    expect(
      getHasPinOrderConflict({
        columnPinning: { left: [], right: ['c', 'd'] },
        newOrder: ['a', 'c', 'b', 'd'],
      }),
    ).toBe(true);
  });

  it('returns false with both left and right pinned in correct positions', () => {
    expect(
      getHasPinOrderConflict({
        columnPinning: { left: ['a'], right: ['d'] },
        newOrder: ['a', 'b', 'c', 'd'],
      }),
    ).toBe(false);
  });

  it('excludes static keys from conflict detection', () => {
    // Without static exclusion this would be a conflict (left pin 'a' not at position 0)
    // but 'static' is excluded so effective order is ['a', 'b'] with 'a' at position 0
    expect(
      getHasPinOrderConflict({
        columnPinning: { left: ['a'], right: [] },
        newOrder: ['static', 'a', 'b'],
        staticKeys: new Set(['static']),
      }),
    ).toBe(false);
  });
});
