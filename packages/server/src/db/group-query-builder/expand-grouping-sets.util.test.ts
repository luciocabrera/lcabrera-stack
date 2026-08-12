/**
 * Expansion is the one part of the builder with no SQL in it, so the whole
 * suite is array equality — which is the point of keeping it over key names
 * rather than emitted text.
 */
import { describe, expect, it } from 'vite-plus/test';

import { expandGroupingSets } from './expand-grouping-sets.util.ts';

const KEYS = ['a', 'b', 'c', 'd'];

describe('expandGroupingSets', () => {
  it.each([1, 2, 3, 4])(
    'emits one set holding every key, flat at depth %i',
    (depth) => {
      const keys = KEYS.slice(0, depth);

      expect(expandGroupingSets({ grouping: 'flat', keys })).toEqual([keys]);
    },
  );

  it.each([1, 2, 3, 4])(
    'emits depth + 1 sets for a rollup at depth %i',
    (depth) => {
      const sets = expandGroupingSets({
        grouping: 'rollup',
        keys: KEYS.slice(0, depth),
      });

      expect(sets).toHaveLength(depth + 1);
    },
  );

  it('drops one trailing key per set, ending at the grand total', () => {
    expect(
      expandGroupingSets({ grouping: 'rollup', keys: ['a', 'b', 'c'] }),
    ).toEqual([['a', 'b', 'c'], ['a', 'b'], ['a'], []]);
  });

  it('makes every rollup set a prefix of the one before it', () => {
    // The property that makes a rollup a hierarchy rather than an arbitrary
    // family of sets — and the one cube will not have.
    const sets = expandGroupingSets({ grouping: 'rollup', keys: KEYS });

    for (const [index, set] of sets.slice(1).entries()) {
      expect(sets[index]?.slice(0, set.length)).toEqual(set);
    }
  });

  it('never emits the set that would make a rollup a cube', () => {
    // `(b)` alone is exactly what separates cube from rollup at depth 2.
    expect(
      expandGroupingSets({ grouping: 'rollup', keys: ['a', 'b'] }),
    ).not.toContainEqual(['b']);
  });
});
