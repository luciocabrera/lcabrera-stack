import type { KeysetSortEntry } from './build-keyset-branch.util.ts';
import type { QueryCursor, QuerySort } from './query-builder.types.ts';

import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertKeysetCursor } from './assert-keyset-cursor.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { buildKeysetBranch } from './build-keyset-branch.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

type BuildKeysetClauseArgs = {
  readonly allowedColumns?: readonly string[];
  readonly cursor?: QueryCursor;
  readonly sort?: readonly QuerySort[];
  readonly startParamIndex?: number;
};

type KeysetClauseResult = {
  readonly nextParamIndex: number;
  /** A bare predicate, ready to be ANDed into a WHERE — no `WHERE` keyword. */
  readonly text: string;
  readonly values: readonly unknown[];
};

/**
 * The keyset ("seek") predicate for `cursor`: the rows that sort strictly after
 * it under `sort`. Expanded lexicographic form — one OR-branch per sort
 * position — rather than the compact row comparison `(a, b) > ($1, $2)`, which
 * cannot express mixed sort directions and is wrong across NULLs (ADR-052).
 *
 * Every cursor value is bound once and referenced by placeholder, so the values
 * array stays one-per-sort-column however many branches reference it. That every
 * one of them IS referenced — pg rejects a bind list longer than the statement's
 * placeholders — rests on the final branch always surviving, which is what
 * `assertKeysetCursor`'s non-null rule for the unique column buys.
 *
 * An empty `text` means there is no cursor; there is no other empty result.
 */
export const buildKeysetClause = ({
  allowedColumns,
  cursor,
  sort = [],
  startParamIndex = 1,
}: BuildKeysetClauseArgs): KeysetClauseResult => {
  if (cursor === undefined) {
    return { nextParamIndex: startParamIndex, text: '', values: [] };
  }

  assertKeysetCursor({ cursor, sort });

  const entries: readonly KeysetSortEntry[] = sort.map(
    ({ column, direction }, index) => {
      assertSafeIdentifier(column);
      assertColumnAllowed({ allowedColumns, column });

      return {
        direction,
        isNullValue:
          cursor.values[index] === null || cursor.values[index] === undefined,
        placeholder: `$${startParamIndex + index}`,
        quotedColumn: quoteIdentifier(column),
      };
    },
  );

  const branches = entries
    .map((_, index) => buildKeysetBranch({ entries, index }))
    .filter((branch) => branch !== undefined);

  return {
    nextParamIndex: startParamIndex + entries.length,
    text: `(${branches.map((branch) => `(${branch})`).join(' OR ')})`,
    values: cursor.values,
  };
};
