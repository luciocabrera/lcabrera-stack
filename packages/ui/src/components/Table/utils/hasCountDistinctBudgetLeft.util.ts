import type { TableColumnAggregate } from '../Table.types';

import { MAX_TABLE_COUNT_DISTINCT_AGGREGATES } from '../Table.constants';
import { countCountDistinct } from './countCountDistinct.util';

/**
 * Whether one more `countDistinct` would still fit — the question an **offering
 * surface** asks, and deliberately not the one `isWithinCountDistinctBudget`
 * answers.
 *
 * A list at the budget is legal and has no room left, so the two differ on
 * exactly the input that matters: `[countDistinct]` is within budget and has
 * none left. Keeping them apart, in files of their own, is what stops a surface
 * reaching for the legality predicate and offering the entry that breaks it.
 *
 * Its caller is `resolveAffordableAggregates`, which asks this of every column
 * **but** the one being offered for — see there for why that exclusion is what
 * keeps an applied aggregate removable.
 */
export const hasCountDistinctBudgetLeft = (
  aggregates: readonly TableColumnAggregate[],
) => countCountDistinct(aggregates) < MAX_TABLE_COUNT_DISTINCT_AGGREGATES;
