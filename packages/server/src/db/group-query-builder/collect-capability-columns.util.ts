import type { GroupAggregate } from './group-query-builder.types.ts';

type CollectCapabilityColumnsArgs = {
  readonly aggregates: readonly GroupAggregate[];
  readonly columnAxisKey?: string;
  readonly keys: readonly string[];
};

export const collectCapabilityColumns = ({
  aggregates,
  columnAxisKey,
  keys,
}: CollectCapabilityColumnsArgs) => {
  const columns = new Set<string>(keys);

  if (columnAxisKey !== undefined) {
    columns.add(columnAxisKey);
  }

  for (const aggregate of aggregates) {
    if (aggregate.column !== undefined) {
      columns.add(aggregate.column);
    }
  }

  return [...columns];
};
