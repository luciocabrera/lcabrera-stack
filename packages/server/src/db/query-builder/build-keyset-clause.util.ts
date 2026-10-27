import type { KeysetSortEntry } from './build-keyset-branch.util.ts';
import type {
  ColumnReference,
  QueryCursor,
  QuerySort,
  ReadScope,
} from './query-builder.types.ts';

import { assertKeysetCursor } from './assert-keyset-cursor.util.ts';
import { buildKeysetBranch } from './build-keyset-branch.util.ts';
import { resolveColumnReference } from './resolve-column-reference.util.ts';

type BuildKeysetClauseArgs = {
  readonly allowedColumns?: readonly string[];
  readonly cursor?: QueryCursor;
  readonly scope?: ReadScope;
  readonly sort?: readonly QuerySort<ColumnReference>[];
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
  scope,
  sort = [],
  startParamIndex = 1,
}: BuildKeysetClauseArgs): KeysetClauseResult => {
  if (cursor === undefined) {
    return { nextParamIndex: startParamIndex, text: '', values: [] };
  }

  assertKeysetCursor({ cursor, sort });

  const entries: readonly KeysetSortEntry[] = sort.map(
    ({ column, direction }, index) => ({
      direction,
      isNullValue:
        cursor.values[index] === null || cursor.values[index] === undefined,
      placeholder: `$${startParamIndex + index}`,
      quotedColumn: resolveColumnReference({
        allowedColumns,
        reference: column,
        scope,
      }).sql,
    }),
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
