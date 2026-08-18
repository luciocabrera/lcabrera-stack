/**
 * Expansion is the one part of the builder with no SQL in it, so the whole
 * suite is array equality — which is the point of keeping it over key names
 * rather than emitted text.
 */
import { describe, expect, it } from 'vite-plus/test';

import { expandCubeSets } from './expand-cube-sets.util.ts';
import { expandGroupingSets } from './expand-grouping-sets.util.ts';

const KEYS = ['a', 'b', 'c', 'd'];
/** Cube's own cap is three, so its cases share a shorter list. */
const CUBE_KEYS = ['a', 'b', 'c'];

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

  it('emits that same set for a cube', () => {
    // The other half of the line above, so the pair reads as one contrast: the
    // mode decides, over an identical key list.
    expect(
      expandGroupingSets({ grouping: 'cube', keys: ['a', 'b'] }),
    ).toContainEqual(['b']);
  });

  it.each([1, 2, 3])('emits 2^%i sets for a cube at that depth', (depth) => {
    const sets = expandGroupingSets({
      grouping: 'cube',
      keys: CUBE_KEYS.slice(0, depth),
    });

    expect(sets).toHaveLength(2 ** depth);
  });

  it('delegates cube unchanged — the dispatcher adds nothing', () => {
    // Keeps this file's job "pick an expansion" rather than "be one". The
    // canonical-order assertions live in `expand-cube-sets.util.test.ts`, and
    // this is what stops the two drifting apart.
    expect(expandGroupingSets({ grouping: 'cube', keys: CUBE_KEYS })).toEqual(
      expandCubeSets({ keys: CUBE_KEYS }),
    );
  });

  it.each(['cube', 'flat', 'rollup'] as const)(
    'never hands back the caller’s own key array, under %s',
    (grouping) => {
      // `readonly` is a compile-time claim and is erased for a published
      // consumer, so identity is what actually stops a mutation reaching back
      // into the caller's list. `flat` regressed here once, by returning
      // `[keys]` where the other two allocate.
      const keys = ['a', 'b', 'c'];
      const sets = expandGroupingSets({ grouping, keys });

      for (const set of sets) {
        expect(set).not.toBe(keys);
      }
    },
  );

  it('starts every mode at the full key list and ends at the grand total', () => {
    // The one shape all three share, and the reason nothing downstream needs a
    // per-mode case: most specific first, grand total last.
    for (const grouping of ['cube', 'rollup'] as const) {
      const sets = expandGroupingSets({ grouping, keys: CUBE_KEYS });

      expect(sets.at(0)).toEqual(CUBE_KEYS);
      expect(sets.at(-1)).toEqual([]);
    }
  });
});
