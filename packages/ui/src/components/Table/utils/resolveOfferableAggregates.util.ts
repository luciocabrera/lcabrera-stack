import type {
  TableAggregateFn,
  TableColumnGroupingCapability,
} from '../Table.types';

import { orderLegalAggregates } from './orderLegalAggregates.util';

type ResolveOfferableAggregatesArgs = {
  readonly capability: TableColumnGroupingCapability | undefined;
  readonly isGroupKey: boolean;
};

const NO_AGGREGATES: readonly TableAggregateFn[] = [];

export const resolveOfferableAggregates = ({
  capability,
  isGroupKey,
}: ResolveOfferableAggregatesArgs) => {
  if (isGroupKey) return NO_AGGREGATES;

  return orderLegalAggregates({ legal: capability?.aggregates ?? [] });
};
