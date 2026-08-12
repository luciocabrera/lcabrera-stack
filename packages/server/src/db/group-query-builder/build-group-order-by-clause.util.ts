import type { GroupSort } from './group-query-builder.types.ts';

import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';

type BuildGroupOrderByClauseArgs = {
  readonly aggregateAliases: readonly string[];
  readonly keys: readonly string[];
  readonly sets: readonly (readonly string[])[];
  readonly sort?: readonly GroupSort[];
  readonly subtotalPlacement?: 'first' | 'last';
};

/**
 * `GROUPING(key) <placement>, key <user>` per key, then any aggregate sort.
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
 * Key terms always precede aggregate terms, which is what makes "rank the
 * parents by their own totals" inexpressible rather than merely discouraged: an
 * aggregate can only order leaves within a parent, never reorder the tree.
 */
export const buildGroupOrderByClause = ({
  aggregateAliases,
  keys,
  sets,
  sort = [],
  subtotalPlacement = 'last',
}: BuildGroupOrderByClauseArgs): string => {
  const placement = subtotalPlacement === 'first' ? 'DESC' : 'ASC';

  const keyTerms = keys.flatMap((key) => {
    const entry = sort.find((item) => 'key' in item && item.key === key);
    const valueTerm = `${quoteIdentifier(key)} ${entry?.direction === 'desc' ? 'DESC' : 'ASC'}`;

    return sets.some((set) => !set.includes(key))
      ? [`GROUPING(${quoteIdentifier(key)}) ${placement}`, valueTerm]
      : [valueTerm];
  });

  // One pass, because every entry is either validated-and-dropped (a key, whose
  // direction the loop above already read) or validated-and-emitted.
  const aggregateTerms: string[] = [];

  for (const entry of sort) {
    if ('key' in entry) {
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

    aggregateTerms.push(
      `${quoteIdentifier(entry.aggregateAlias)} ${entry.direction === 'desc' ? 'DESC' : 'ASC'}`,
    );
  }

  return `ORDER BY ${[...keyTerms, ...aggregateTerms].join(', ')}`;
};
