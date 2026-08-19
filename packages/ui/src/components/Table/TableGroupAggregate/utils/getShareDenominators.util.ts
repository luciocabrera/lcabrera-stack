import type {
  TableGroupRow,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

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

const toSummaries = (rows: readonly unknown[]) => {
  const summaries: TableGroupRowSummary[] = [];

  for (const row of rows) {
    const summary = (row as Partial<TableGroupRow>)[TABLE_GROUP_ROW_FIELD];

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

  if (cached !== undefined && cached.sharesKey === sharesKey) {
    return cached.denominators;
  }

  const denominators = resolveShareDenominators({
    shares,
    summaries: toSummaries(rows),
  });

  cache.set(rows, { denominators, sharesKey });

  return denominators;
};
