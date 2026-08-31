import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { isWithinCountDistinctBudget } from '#ui/components/Table/utils/isWithinCountDistinctBudget.util';
import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

export const areGroupAggregatesLegal = (
  aggregates: readonly TableColumnAggregate[],
) =>
  new Set(aggregates.map((entry) => toTableAggregateToken(entry))).size ===
    aggregates.length && isWithinCountDistinctBudget(aggregates);
