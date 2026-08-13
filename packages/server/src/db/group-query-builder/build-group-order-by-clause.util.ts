import type { GroupSort } from './group-query-builder.types.ts';

import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';
import { assertGroupSort } from './assert-group-sort.util.ts';

type BuildGroupOrderByClauseArgs = {
  readonly aggregateAliases: readonly string[];
  readonly keys: readonly string[];
  readonly sets: readonly (readonly string[])[];
  readonly sort?: readonly GroupSort[];
  readonly subtotalPlacement?: 'first' | 'last';
};

const toDirection = (direction: 'asc' | 'desc' | undefined) =>
  direction === 'desc' ? 'DESC' : 'ASC';

/**
 * `GROUPING(key) <placement>, key <user>` per key, with any aggregate sort
 * spliced in at the innermost level.
 *
 * The leading `GROUPING` term is what puts a subtotal beside the rows it
 * totals, and it is emitted only when that key is rolled up in at least one
 * set — so a flat grouping produces byte-identical output to the flat builder's
 * `ORDER BY`.
 *
 * **No `NULLS FIRST`/`NULLS LAST` anywhere, deliberately.** The `GROUPING` term
 * partitions the rows first: where it is 1 the key is NULL on every row in the
 * partition, so the following term orders nothing; where it is 0 the key is
 * real data and a genuine NULL takes Postgres's default placement, exactly as
 * the ungrouped list view gives it. The two kinds of NULL are never adjacent,
 * so there is no placement to state — and emitting one would break
 * `build-keyset-comparison.util.ts`, which depends on the default.
 *
 * **An aggregate sort lands after the innermost key's `GROUPING` term and ahead
 * of that key's own value term**, which is the one position where it does
 * anything and still keeps the tree: every ancestor level is already separated
 * by the terms above it, and `GROUPING(kₙ)` still holds each parent's subtotal
 * apart from the rows it totals. Appending it after the value term instead —
 * the shape this replaces — emits a term that can never fire, because within a
 * grouping set the key columns identify the row on their own. The value term
 * stays, last, as the tiebreak two equal aggregates would otherwise have none
 * of.
 *
 * Ranking an ancestor by an aggregate is refused rather than reordered — see
 * `assert-group-sort.util.ts`, which every request passes through first.
 */
export const buildGroupOrderByClause = ({
  aggregateAliases,
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
      ? [`GROUPING(${quoteIdentifier(key)}) ${placement}`]
      : [];

    return index === keys.length - 1
      ? [...groupingTerms, ...aggregateTerms, valueTerm]
      : [...groupingTerms, valueTerm];
  });

  return `ORDER BY ${terms.join(', ')}`;
};
