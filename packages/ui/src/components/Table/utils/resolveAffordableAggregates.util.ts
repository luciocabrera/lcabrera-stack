import type {
  TableAggregateFn,
  TableColumnAggregate,
  TableColumnGroupingCapability,
} from '../Table.types';

import { hasCountDistinctBudgetLeft } from './hasCountDistinctBudgetLeft.util';
import { resolveOfferableAggregates } from './resolveOfferableAggregates.util';

type ResolveAffordableAggregatesArgs = {
  /**
   * Every aggregate applied in **this surface's** commit context, across every
   * column — the live grouping for the header menu, the drawer's draft for the
   * picker.
   */
  readonly applied: readonly TableColumnAggregate[];
  /** What the catalogue said about this column (ADR-058); absent means nothing. */
  readonly capability: TableColumnGroupingCapability | undefined;
  readonly columnKey: string;
  readonly isGroupKey: boolean;
};

const NO_AGGREGATES: readonly TableAggregateFn[] = [];

/**
 * `resolveOfferableAggregates` answers per column, from the catalogue's type legality and
 * group-key membership.
 * This composes a rule that column cannot see: `@lcabrera/server` refuses a read carrying
 * more than `MAX_TABLE_COUNT_DISTINCT_AGGREGATES` `countDistinct` aggregates, and the
 * count is over every column together (#842).
 */
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
