/**
 * The mask is the only thing separating "all countries" from a country that is
 * genuinely NULL, so a wrong bit order does not fail — it mislabels a subtotal
 * as data. Every case here pins a bit position rather than a total.
 */
import { describe, expect, it } from 'vite-plus/test';

import { expandGroupingSets } from './expand-grouping-sets.util.ts';
import { toGroupingSetMask } from './to-grouping-set-mask.util.ts';

const KEYS = ['order_status', 'shipping_country'];

describe('toGroupingSetMask', () => {
  it('is zero when every key is present', () => {
    expect(toGroupingSetMask({ keys: KEYS, set: KEYS })).toBe(0);
  });

  it('gives the first key the most significant bit', () => {
    expect(toGroupingSetMask({ keys: KEYS, set: ['shipping_country'] })).toBe(
      2,
    );
    expect(toGroupingSetMask({ keys: KEYS, set: ['order_status'] })).toBe(1);
  });

  it('sets every bit for the grand total', () => {
    expect(toGroupingSetMask({ keys: KEYS, set: [] })).toBe(3);
  });

  it('produces the masks Postgres reports for a depth-2 rollup', () => {
    const sets = expandGroupingSets({ grouping: 'rollup', keys: KEYS });

    expect(sets.map((set) => toGroupingSetMask({ keys: KEYS, set }))).toEqual([
      0, 1, 3,
    ]);
  });

  it('never produces mask 2 for a rollup, which is what makes it a rollup', () => {
    const sets = expandGroupingSets({ grouping: 'rollup', keys: KEYS });

    expect(
      sets.map((set) => toGroupingSetMask({ keys: KEYS, set })),
    ).not.toContain(2);
  });

  it('is zero for a flat grouping at every depth', () => {
    const keys = ['a', 'b', 'c', 'd'];
    const sets = expandGroupingSets({ grouping: 'flat', keys });

    expect(sets.map((set) => toGroupingSetMask({ keys, set }))).toEqual([0]);
  });

  it('assigns each key a distinct power of two at depth 4', () => {
    const keys = ['a', 'b', 'c', 'd'];

    expect(
      keys.map((rolledUp) =>
        toGroupingSetMask({
          keys,
          set: keys.filter((key) => key !== rolledUp),
        }),
      ),
    ).toEqual([8, 4, 2, 1]);
  });
});
