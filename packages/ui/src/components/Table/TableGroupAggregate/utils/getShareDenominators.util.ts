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
  readonly rows: readonly unknown[];
  readonly shares: readonly TableColumnAggregate[];
};

/**
 * Keyed on the rows array itself and held **weakly**, so an entry lives exactly as long as
 * the rows it describes and a navigation drops it with them.
 * The cache is not an optimisation to revisit later, it is what makes the derivation
 * affordable at all: the denominator is a fold over every row, a grouped read is capped in
 * the thousands of them, and every measure cell on every row asks for it — so recomputing
 * per cell is quadratic in the row count where this is linear (#648).
 */
const cache = new WeakMap<readonly unknown[], CacheEntry>();

/**
 * A cast would let a malformed summary reach `resolveShareDenominators`, which
 * dereferences `isSubtotal` and `path` — so a row shaped wrongly throws inside a store
 * snapshot, where a thrown error is a blank table rather than a missing percentage.
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
 * **It is `JSON.stringify` over the tuples rather than a delimiter join** — the same
 * encoding and the same reason as `resolveGroupPathKey`: a column key is a consumer's
 * identifier and may contain any character, so a joined form collides the moment one
 * contains the delimiter.
 * Under a space join, `[('x','sum'), ('y','avg')]` and `[('x:sum y','avg')]` both key as
 * `x:sum y:avg`, so the second read against the same rows array comes back with the
 * *first* selection's denominators — a wrong percentage on screen, with nothing thrown and
 * nothing logged.
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
