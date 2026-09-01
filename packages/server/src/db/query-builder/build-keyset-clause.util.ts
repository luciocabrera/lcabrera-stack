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
  readonly text: string;
  readonly values: readonly unknown[];
};

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
    .filter((branch) => branch !== undefined)
    .map((branch) => `(${branch})`);

  return {
    nextParamIndex: startParamIndex + entries.length,
    text: `(${branches.join(' OR ')})`,
    values: cursor.values,
  };
};
