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

const cache = new WeakMap<readonly unknown[], CacheEntry>();

const toSummaries = (rows: readonly unknown[]) => {
  const summaries: TableGroupRowSummary[] = [];

  for (const row of rows) {
    if (!isObject(row)) continue;

    const summary = getTableGroupRowSummary(row);

    if (summary !== undefined) summaries.push(summary);
  }

  return summaries;
};

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
