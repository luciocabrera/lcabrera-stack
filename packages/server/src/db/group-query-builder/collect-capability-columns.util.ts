import type { GroupAggregate } from './group-query-builder.types.ts';

type CollectCapabilityColumnsArgs = {
  readonly aggregates: readonly GroupAggregate[];
  readonly keys: readonly string[];
};

export const collectCapabilityColumns = ({
  aggregates,
  keys,
}: CollectCapabilityColumnsArgs) => {
  const columns = new Set<string>(keys);

  for (const aggregate of aggregates) {
    if (aggregate.column !== undefined) {
      columns.add(aggregate.column);
    }
  }

  return [...columns];
};
