import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { isShareableAggregate } from './isShareableAggregate.util';

type PruneGroupSharesArgs = {
  readonly aggregates: Readonly<Record<string, TableAggregateFn>>;
  readonly shares: readonly string[];
};

/**
 * The shares that still describe something: those on a column carrying an
 * aggregate a share is defined for.
 *
 * A share is a ratio over a measure, so one on a column with **no** aggregate
 * divides nothing, and one on a **non-additive** aggregate divides by a
 * denominator the client cannot derive — see `isShareableAggregate` for the
 * measured reason that is a legality question rather than a rounding one.
 *
 * Pruning rather than refusing, because this runs on state the loader already
 * sanitized: the URL path refuses the whole configuration
 * (`sanitizeGroupingByColumns`, ADR-061), and by the time the store is seeded a
 * share left over from an aggregate the user has since changed is a stale
 * member of the client's own state, not a claim about a link (#648).
 */
export const pruneGroupShares = ({
  aggregates,
  shares,
}: PruneGroupSharesArgs) =>
  shares.filter((columnKey) => isShareableAggregate(aggregates[columnKey]));
