/**
 * Cube's expansion is pure array work, so the suite is array equality — the
 * same property that keeps `expand-grouping-sets.util.test.ts` free of SQL.
 *
 * The order is asserted against the sequence the PostgreSQL manual lists for
 * `CUBE ( a, b, c )` verbatim, because "every subset" does not pin an order and
 * a set-equal-but-reordered expansion would still satisfy every other test here
 * while emitting rows in an order no `CUBE` query produces.
 */
import { describe, expect, it } from 'vite-plus/test';

import { expandCubeSets } from './expand-cube-sets.util.ts';
import { expandGroupingSets } from './expand-grouping-sets.util.ts';
import { toGroupingSetMask } from './to-grouping-set-mask.util.ts';

const KEYS = ['a', 'b', 'c'];

describe('expandCubeSets', () => {
  it('emits the sets `CUBE (a, b, c)` emits, in the manual’s order', () => {
    expect(expandCubeSets({ keys: KEYS })).toEqual([
      ['a', 'b', 'c'],
      ['a', 'b'],
      ['a', 'c'],
      ['a'],
      ['b', 'c'],
      ['b'],
      ['c'],
      [],
    ]);
  });

  it.each([1, 2, 3])('emits 2^%i sets', (depth) => {
    const keys = ['a', 'b', 'c'].slice(0, depth);

    expect(expandCubeSets({ keys })).toHaveLength(2 ** depth);
  });

  it('emits every subset exactly once', () => {
    const sets = expandCubeSets({ keys: KEYS });
    const seen = new Set(sets.map((set) => set.join('|')));

    expect(seen.size).toBe(sets.length);
  });

  it('preserves the key order inside every set', () => {
    const sets = expandCubeSets({ keys: KEYS });

    for (const set of sets) {
      expect(set).toEqual(KEYS.filter((key) => set.includes(key)));
    }
  });

  it('walks the `GROUPING()` mask 0 → 2ⁿ-1, which is what fixes the order', () => {
    const masks = expandCubeSets({ keys: KEYS }).map((set) =>
      toGroupingSetMask({ keys: KEYS, set }),
    );

    expect(masks).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('emits a set that no rollup over the same keys produces', () => {
    const cube = expandCubeSets({ keys: KEYS }).map((set) => set.join('|'));
    const rollup = expandGroupingSets({ grouping: 'rollup', keys: KEYS }).map(
      (set) => set.join('|'),
    );

    expect(cube).toContain('b');
    expect(rollup).not.toContain('b');
    expect(cube.filter((set) => !rollup.includes(set))).toEqual([
      'a|c',
      'b|c',
      'b',
      'c',
    ]);
  });

  it('contains every rollup set, so cube only ever adds', () => {
    const cube = expandCubeSets({ keys: KEYS }).map((set) => set.join('|'));
    const rollup = expandGroupingSets({ grouping: 'rollup', keys: KEYS });

    for (const set of rollup) {
      expect(cube).toContain(set.join('|'));
    }
  });

  it('emits the grand total exactly once, last', () => {
    const sets = expandCubeSets({ keys: KEYS });

    expect(sets.filter((set) => set.length === 0)).toHaveLength(1);
    expect(sets.at(-1)).toEqual([]);
  });

  it('emits a single empty set for no keys', () => {
    expect(expandCubeSets({ keys: [] })).toEqual([[]]);
  });
});
