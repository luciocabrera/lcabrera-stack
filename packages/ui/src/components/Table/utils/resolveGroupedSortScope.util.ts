import type { TableColumn, TableColumnAggregate } from '../Table.types';

import { resolveDeclaredGroupingKeys } from './resolveDeclaredGroupingKeys.util';
import { toTableAggregateToken } from './tableAggregateToken.util';

type ResolveGroupedSortScopeArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columns: readonly TableColumn<TData>[];
  readonly groupingKeys: readonly string[];
};

export const resolveGroupedSortScope = <TData>({
  aggregates,
  columns,
  groupingKeys,
}: ResolveGroupedSortScopeArgs<TData>) => {
  const keys = resolveDeclaredGroupingKeys({ columns, groupingKeys });

  if (keys.length === 0) return;

  return new Set<string>([
    ...keys,
    ...aggregates.map((aggregate) => toTableAggregateToken(aggregate)),
  ]);
};
