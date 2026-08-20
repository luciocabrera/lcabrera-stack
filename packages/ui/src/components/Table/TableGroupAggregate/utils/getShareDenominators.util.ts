import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type {
  TableColumnAggregate,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

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
  readonly shares: readonly TableColumnAggregate[];
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
 * The grand total each shared measure divides by, computed once per data set
 * and keyed by the measure's `(columnKey, fn)` token (#831).
 *
 * `sharesKey` is compared alongside the array identity because the two change
 * independently: turning a share on leaves the rows exactly as they were, so an
 * entry keyed on the rows alone would answer for the previous selection.
 *
 * **It is `JSON.stringify` over the tuples rather than a delimiter join** — the
 * same encoding and the same reason as `resolveGroupPathKey`: a column key is a
 * consumer's identifier and may contain any character, so a joined form collides
 * the moment one contains the delimiter. Under a space join,
 * `[('x','sum'), ('y','avg')]` and `[('x:sum y','avg')]` both key as
 * `x:sum y:avg`, so the second read against the same rows array comes back with
 * the *first* selection's denominators — a wrong percentage on screen, with
 * nothing thrown and nothing logged. No separator is safe against an arbitrary
 * column key, which is why there is none.
 *
 * The right-split token is still the right key *inside* the map: it is injective
 * over `(columnKey, fn)` because the function vocabulary is closed and contains
 * no `:`, and every lookup compares one whole token rather than a run of them.
 * Concatenation is what this key had to be protected from.
 */
export const getShareDenominators = ({
  rows,
  shares,
}: GetShareDenominatorsArgs) => {
  const sharesKey = JSON.stringify(
    shares.map(({ columnKey, fn }) => [columnKey, fn]),
  );
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
