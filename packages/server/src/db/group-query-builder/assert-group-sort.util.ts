import type { GroupSort } from './group-query-builder.types.ts';

type AssertGroupSortArgs = {
  readonly aggregateAliases: readonly string[];
  readonly keys: readonly string[];
  readonly sort: readonly GroupSort[];
};

/**
 * Demotion was the previous behaviour, and it emits a term that orders nothing: within one
 * grouping set the key columns already identify the row, so the sort the caller asked for
 * was accepted, emitted, and dead.
 * A refusal is the only answer that cannot be mistaken for having worked.
 */
export const assertGroupSort = ({
  aggregateAliases,
  keys,
  sort,
}: AssertGroupSortArgs) => {
  let rankingAlias: string | undefined;

  for (const entry of sort) {
    if ('key' in entry) {
      if (rankingAlias !== undefined) {
        throw new Error(
          `Cannot sort by "${rankingAlias}" ahead of group key "${entry.key}": an aggregate may order the innermost level only, never rank an ancestor.`,
        );
      }

      if (!keys.includes(entry.key)) {
        throw new Error(
          `Cannot sort by "${entry.key}": it is not one of this query's group keys.`,
        );
      }

      continue;
    }

    if (!aggregateAliases.includes(entry.aggregateAlias)) {
      throw new Error(
        `Cannot sort by "${entry.aggregateAlias}": it is not one of this query's aggregates.`,
      );
    }

    rankingAlias ??= entry.aggregateAlias;
  }
};
