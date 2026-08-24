import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { isWithinCountDistinctBudget } from '#ui/components/Table/utils/isWithinCountDistinctBudget.util';
import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

/**
 * Whether an aggregate list is a legal **shape** for a grouping: no `(columnKey, fn)` pair
 * repeated, and no more `countDistinct` aggregates than one read can carry.
 * `areGroupKeysLegal` beside this one is the model, and the reason is the same: the store
 * is the boundary a published package exposes to a consumer writing their own loader, and
 * a shape the table cannot render must be refused there rather than seeded.
 */
export const areGroupAggregatesLegal = (
  aggregates: readonly TableColumnAggregate[],
) =>
  new Set(aggregates.map((entry) => toTableAggregateToken(entry))).size ===
    aggregates.length && isWithinCountDistinctBudget(aggregates);
