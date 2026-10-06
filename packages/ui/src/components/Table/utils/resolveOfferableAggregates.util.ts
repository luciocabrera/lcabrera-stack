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
  return isGroupKey
    ? NO_AGGREGATES
    : orderLegalAggregates({ legal: capability?.aggregates ?? [] });
};
