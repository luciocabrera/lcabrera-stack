import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

import { isShareableAggregate } from './isShareableAggregate.util';

type PruneGroupSharesArgs = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly shares: readonly TableColumnAggregate[];
};

/**
 * A share is a ratio over a measure, so one naming an aggregate that is not applied
 * divides nothing, and one on a **non-additive** aggregate divides by a denominator the
 * client cannot derive — see `isShareableAggregate` for the measured reason that is a
 * legality question rather than a rounding one.
 * It matches on the `(columnKey, fn)` pair rather than on the column, because a column may
 * carry several aggregates and `sum` and `count` are both shareable: removing one of them
 * must leave the other's share exactly as it was (#831).
 */
export const pruneGroupShares = ({
  aggregates,
  shares,
}: PruneGroupSharesArgs) => {
  const shareable = new Set(
    aggregates
      .filter(({ fn }) => isShareableAggregate(fn))
      .map((entry) => toTableAggregateToken(entry)),
  );

  return shares.filter((share) => shareable.has(toTableAggregateToken(share)));
};
