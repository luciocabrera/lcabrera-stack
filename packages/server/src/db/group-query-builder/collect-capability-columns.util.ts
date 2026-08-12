import type { GroupAggregate } from './group-query-builder.types.ts';

type CollectCapabilityColumnsArgs = {
  readonly aggregates: readonly GroupAggregate[];
  readonly keys: readonly string[];
};

/**
 * Every column a grouped read has to know the capabilities of: its group keys,
 * plus the column each aggregate is applied to.
 *
 * De-duplicated, because the catalogue query takes a column list and asking for
 * the same column twice would return it twice — and `count(*)` contributes no
 * column at all, which is why this is not a plain concatenation.
 *
 * Order is preserved (keys first, then aggregate columns in declaration order)
 * so the query text a test asserts is stable rather than set-ordered.
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
