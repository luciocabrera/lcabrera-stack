import type { GroupSort } from './group-query-builder.types.ts';

import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';
import { assertGroupSort } from './assert-group-sort.util.ts';

type BuildGroupOrderByClauseArgs = {
  readonly aggregateAliases: readonly string[];
  readonly expressionByKey?: Readonly<Record<string, string>>;
  readonly keys: readonly string[];
  readonly sets: readonly (readonly string[])[];
  readonly sort?: readonly GroupSort[];
  readonly subtotalPlacement?: 'first' | 'last';
};

const toDirection = (direction: 'asc' | 'desc' | undefined) =>
  direction === 'desc' ? 'DESC' : 'ASC';

/**
 * `GROUPING(key) <placement>, key <user>` per key, with any aggregate sort spliced in at
 * the innermost level.
 * The leading `GROUPING` term is what puts a subtotal beside the rows it totals, and it is
 * emitted only when that key is rolled up in at least one set — so a flat grouping
 * produces byte-identical output to the flat builder's `ORDER BY`.
 */
export const buildGroupOrderByClause = ({
  aggregateAliases,
  expressionByKey = {},
  keys,
  sets,
  sort = [],
  subtotalPlacement = 'last',
}: BuildGroupOrderByClauseArgs): string => {
  assertGroupSort({ aggregateAliases, keys, sort });

  const placement = subtotalPlacement === 'first' ? 'DESC' : 'ASC';

  // One pass into an array this call allocated: a key entry is dropped here
  // (the key loop below reads its direction in place) and an aggregate entry is
  // emitted in request order.
  const aggregateTerms: string[] = [];

  for (const entry of sort) {
    if ('key' in entry) continue;

    aggregateTerms.push(
      `${quoteIdentifier(entry.aggregateAlias)} ${toDirection(entry.direction)}`,
    );
  }

  const terms = keys.flatMap((key, index) => {
    const entry = sort.find((item) => 'key' in item && item.key === key);
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
