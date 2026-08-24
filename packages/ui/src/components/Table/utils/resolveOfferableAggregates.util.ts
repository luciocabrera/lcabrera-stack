import type {
  TableAggregateFn,
  TableColumnGroupingCapability,
} from '../Table.types';

import { orderLegalAggregates } from './orderLegalAggregates.util';

type ResolveOfferableAggregatesArgs = {
  /** What the catalogue said about this column (ADR-058); absent means nothing. */
  readonly capability: TableColumnGroupingCapability | undefined;
  readonly isGroupKey: boolean;
};

const NO_AGGREGATES: readonly TableAggregateFn[] = [];

/**
 * Catalogue legality (ADR-058) plus "not an active group key" (ADR-080).
 * Empty means none legal, never all.
 * Whole-request rules compose on top in `resolveAffordableAggregates`.
 */
export const resolveOfferableAggregates = ({
  capability,
  isGroupKey,
}: ResolveOfferableAggregatesArgs) => {
  if (isGroupKey) return NO_AGGREGATES;

  return orderLegalAggregates({ legal: capability?.aggregates ?? [] });
};
