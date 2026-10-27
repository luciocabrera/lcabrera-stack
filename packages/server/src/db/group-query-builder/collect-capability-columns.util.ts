import type { ColumnReference } from '../query-builder/query-builder.types.ts';
import type { GroupAggregate } from './group-query-builder.types.ts';

import { toColumnName } from '../query-builder/to-column-name.util.ts';

type CollectCapabilityColumnsArgs = {
  readonly aggregates: readonly GroupAggregate[];
  readonly columnAxisKey?: ColumnReference;
  readonly keys: readonly ColumnReference[];
};

export const collectCapabilityColumns = ({
  aggregates,
  columnAxisKey,
  keys,
}: CollectCapabilityColumnsArgs) => {
  const columns = new Map<string, ColumnReference>();
  const references = [
    ...keys,
    ...(columnAxisKey === undefined ? [] : [columnAxisKey]),
    ...aggregates
      .map((aggregate) => aggregate.column)
      .filter((column) => column !== undefined),
  ];

  for (const reference of references) {
    columns.set(toColumnName(reference), reference);
  }

  return columns.values().toArray();
};
