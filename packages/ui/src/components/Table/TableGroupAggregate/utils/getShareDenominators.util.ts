import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

import { resolveShareDenominators } from './resolveShareDenominators.util';

type CacheEntry = {
  readonly denominators: ReadonlyMap<string, number>;
  readonly sharesKey: string;
};

type GetShareDenominatorsArgs = {
  /**
   * The data store's rows, **as they sit in the store**. The array identity is
   * the cache key, so it must be the stored reference rather than anything
   * derived from it — extracting the summaries here rather than at the call
   * site is what keeps that true.
   */
  readonly rows: readonly unknown[];
  readonly shares: readonly string[];
};

/**
 * One derivation per data set, reused by every cell that reads from it.
 *
 * Keyed on the rows array itself and held **weakly**, so an entry lives exactly
 * as long as the rows it describes and a navigation drops it with them.
 *
 * The cache is not an optimisation to revisit later, it is what makes the
 * derivation affordable at all: the denominator is a fold over every row, a
 * grouped read is capped in the thousands of them, and every measure cell on
 * every row asks for it — so recomputing per cell is quadratic in the row count
 * where this is linear (#648).
 */
const cache = new WeakMap<readonly unknown[], CacheEntry>();

/**
 * Validated rather than cast, through the same guard the render path uses.
 *
 * A cast would let a malformed summary reach `resolveShareDenominators`, which
 * dereferences `isSubtotal` and `path` — so a row shaped wrongly throws inside a
 * store snapshot, where a thrown error is a blank table rather than a missing
 * percentage. The rest of the grid answers this question with
 * `getTableGroupRowSummary`, and two answers to it could disagree about which
 * rows exist.
 */
const toSummaries = (rows: readonly unknown[]) => {
  const summaries: TableGroupRowSummary[] = [];

  for (const row of rows) {
    if (!isObject(row)) continue;

    const summary = getTableGroupRowSummary(row);

    if (summary !== undefined) summaries.push(summary);
  }

  return summaries;
};

/**
 * The grand total each shared column divides by, computed once per data set.
 *
 * `sharesKey` is compared alongside the array identity because the two change
 * independently: turning a share on leaves the rows exactly as they were, so an
 * entry keyed on the rows alone would answer for the previous selection.
 */
export const getShareDenominators = ({
  rows,
  shares,
}: GetShareDenominatorsArgs) => {
  const sharesKey = shares.join(' ');
  const cached = cache.get(rows);

  if (cached?.sharesKey === sharesKey) {
    return cached.denominators;
  }

  const denominators = resolveShareDenominators({
    shares,
    summaries: toSummaries(rows),
  });

  cache.set(rows, { denominators, sharesKey });

  return denominators;
};
