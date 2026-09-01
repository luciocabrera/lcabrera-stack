import type {
  TableAggregateFn,
  TableColumnAggregate,
  TableColumnGroupingCapability,
} from '../Table.types';

import { hasCountDistinctBudgetLeft } from './hasCountDistinctBudgetLeft.util';
import { resolveOfferableAggregates } from './resolveOfferableAggregates.util';

type ResolveAffordableAggregatesArgs = {
  readonly applied: readonly TableColumnAggregate[];
  readonly capability: TableColumnGroupingCapability | undefined;
  readonly columnKey: string;
  readonly isGroupKey: boolean;
};

const NO_AGGREGATES: readonly TableAggregateFn[] = [];

export const resolveAffordableAggregates = ({
  applied,
  capability,
  columnKey,
  isGroupKey,
}: ResolveAffordableAggregatesArgs) => {
  const offerable = resolveOfferableAggregates({ capability, isGroupKey });
  const appliedElsewhere = applied.filter(
    (aggregate) => aggregate.columnKey !== columnKey,
  );

  if (hasCountDistinctBudgetLeft(appliedElsewhere)) {
    return { affordable: offerable, withheld: NO_AGGREGATES };
  }

  return {
    affordable: offerable.filter((fn) => fn !== 'countDistinct'),
    withheld: offerable.filter((fn) => fn === 'countDistinct'),
  };
};
