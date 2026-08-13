import type { GroupSort } from './group-query-builder.types.ts';

type AssertGroupSortArgs = {
  readonly aggregateAliases: readonly string[];
  readonly keys: readonly string[];
  readonly sort: readonly GroupSort[];
};

/**
 * Every rule a grouped `ORDER BY` request clears before a single term is
 * emitted.
 *
 * Two of the three are name checks — a key that is not one of this query's
 * keys, an alias this query does not project. Either would otherwise reach
 * Postgres as an identifier the planner refuses, so the failure would arrive as
 * a database error instead of as a description of what the caller asked for.
 *
 * The third is structural. An aggregate term orders whatever the terms before
 * it have not already separated, so its **position** decides which level of the
 * tree it acts on: after every key it orders the innermost siblings within
 * their parent, ahead of a key it orders that key's own level and interleaves a
 * subtotal with rows it does not total. Ranking parents by their own totals is
 * a real thing to want, and doing it correctly needs the parent's aggregate on
 * the child row (`sum(…) OVER (PARTITION BY k₁)`) — a named v2, not this.
 *
 * So an aggregate listed ahead of a key is **refused** rather than quietly
 * demoted behind it. Demotion was the previous behaviour, and it emits a term
 * that orders nothing: within one grouping set the key columns already identify
 * the row, so the sort the caller asked for was accepted, emitted, and dead. A
 * refusal is the only answer that cannot be mistaken for having worked.
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
