import type { GroupAggregate } from './group-query-builder.types.ts';

type CollectCapabilityColumnsArgs = {
  readonly aggregates: readonly GroupAggregate[];
  readonly keys: readonly string[];
};

/**
 * De-duplicated, because the catalogue query takes a column list and asking for the same
 * column twice would return it twice — and `count(*)` contributes no column at all, which
 * is why this is not a plain concatenation.
 */
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
