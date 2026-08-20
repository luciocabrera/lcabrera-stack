import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

import { isShareableAggregate } from './isShareableAggregate.util';

type PruneGroupSharesArgs = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly shares: readonly TableColumnAggregate[];
};

/**
 * The shares that still describe something: those naming an **applied**
 * aggregate a share is defined for.
 *
 * A share is a ratio over a measure, so one naming an aggregate that is not
 * applied divides nothing, and one on a **non-additive** aggregate divides by a
 * denominator the client cannot derive — see `isShareableAggregate` for the
 * measured reason that is a legality question rather than a rounding one.
 *
 * It matches on the `(columnKey, fn)` pair rather than on the column, because a
 * column may carry several aggregates and `sum` and `count` are both shareable:
 * removing one of them must leave the other's share exactly as it was (#831).
 *
 * Pruning rather than refusing, because this runs on state the loader already
 * sanitized: the URL path refuses the whole configuration
 * (`sanitizeGroupingByColumns`, ADR-061), and by the time the store is seeded a
 * share left over from an aggregate the user has since removed is a stale
 * member of the client's own state, not a claim about a link (#648).
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
