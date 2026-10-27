import type { ColumnReference } from '../query-builder/query-builder.types.ts';
import type { GroupSort } from './group-query-builder.types.ts';

import { isSameColumnReference } from '../query-builder/is-same-column-reference.util.ts';
import { toColumnName } from '../query-builder/to-column-name.util.ts';

type AssertGroupSortArgs = {
  readonly aggregateAliases: readonly string[];
  readonly hasColumnAxis?: boolean;
  readonly keys: readonly ColumnReference[];
  readonly sort: readonly GroupSort[];
};

export const assertGroupSort = ({
  aggregateAliases,
  hasColumnAxis = false,
  keys,
  sort,
}: AssertGroupSortArgs) => {
  let rankingAlias: string | undefined;

  for (const entry of sort) {
    if ('key' in entry) {
      const name = toColumnName(entry.key);

      if (rankingAlias !== undefined) {
        throw new Error(
          `Cannot sort by "${rankingAlias}" ahead of group key "${name}": an aggregate may order the innermost level only, never rank an ancestor.`,
        );
      }

      if (
        keys.every(
          (key) => !isSameColumnReference({ left: key, right: entry.key }),
        )
      ) {
        throw new Error(
          `Cannot sort by "${name}": it is not one of this query's group keys.`,
        );
      }

      continue;
    }

    if (!aggregateAliases.includes(entry.aggregateAlias)) {
      throw new Error(
        hasColumnAxis
          ? `Cannot sort by "${entry.aggregateAlias}": a column axis expands aggregates to _c0, _c1, … aliases; sort by one of those.`
          : `Cannot sort by "${entry.aggregateAlias}": it is not one of this query's aggregates.`,
      );
    }

    rankingAlias ??= entry.aggregateAlias;
  }
};
