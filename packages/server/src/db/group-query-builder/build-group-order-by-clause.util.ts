import type { ColumnReference } from '../query-builder/query-builder.types.ts';
import type { GroupSort } from './group-query-builder.types.ts';

import { isSameColumnReference } from '../query-builder/is-same-column-reference.util.ts';
import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';
import { toColumnName } from '../query-builder/to-column-name.util.ts';
import { assertGroupSort } from './assert-group-sort.util.ts';

type BuildGroupOrderByClauseArgs = {
  readonly aggregateAliases: readonly string[];
  readonly expressionByKey?: Readonly<Record<string, string>>;
  readonly hasColumnAxis?: boolean;
  readonly keys: readonly ColumnReference[];
  readonly sets: readonly (readonly string[])[];
  readonly sort?: readonly GroupSort[];
  readonly subtotalPlacement?: 'first' | 'last';
};

const toDirection = (direction: 'asc' | 'desc' | undefined) =>
  direction === 'desc' ? 'DESC' : 'ASC';

export const buildGroupOrderByClause = ({
  aggregateAliases,
  expressionByKey = {},
  hasColumnAxis = false,
  keys,
  sets,
  sort = [],
  subtotalPlacement = 'last',
}: BuildGroupOrderByClauseArgs): string => {
  assertGroupSort({ aggregateAliases, hasColumnAxis, keys, sort });

  const placement = subtotalPlacement === 'first' ? 'DESC' : 'ASC';

  const aggregateTerms: string[] = [];

  for (const entry of sort) {
    if ('key' in entry) continue;

    aggregateTerms.push(
      `${quoteIdentifier(entry.aggregateAlias)} ${toDirection(entry.direction)}`,
    );
  }

  const terms = keys.flatMap((reference, index) => {
    const key = toColumnName(reference);
    const entry = sort.find(
      (item) =>
        'key' in item &&
        isSameColumnReference({ left: item.key, right: reference }),
    );
    const valueTerm = `${quoteIdentifier(key)} ${toDirection(entry?.direction)}`;
    const groupingTerms = sets.some((set) => !set.includes(key))
      ? [
          `GROUPING(${expressionByKey[key] ?? quoteIdentifier(key)}) ${placement}`,
        ]
      : [];

    return index === keys.length - 1
      ? [...groupingTerms, ...aggregateTerms, valueTerm]
      : [...groupingTerms, valueTerm];
  });

  return `ORDER BY ${terms.join(', ')}`;
};
