import type { ColumnReference, ReadScope } from './query-builder.types.ts';

import { QueryRefusedError } from '../../errors/query-refused.error.ts';
import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

type ResolveColumnReferenceArgs = {
  readonly allowedColumns?: readonly string[];
  readonly reference: ColumnReference;
  readonly scope?: ReadScope;
};

export const resolveColumnReference = ({
  allowedColumns,
  reference,
  scope,
}: ResolveColumnReferenceArgs) => {
  if (typeof reference === 'string') {
    assertSafeIdentifier(reference);
    assertColumnAllowed({
      allowedColumns: scope?.base.allowedColumns ?? allowedColumns,
      column: reference,
    });

    const quoted = quoteIdentifier(reference);

    return {
      isJoined: false,
      name: reference,
      sql:
        scope === undefined
          ? quoted
          : `${quoteIdentifier(scope.base.qualifier)}.${quoted}`,
    };
  }

  const { column, source } = reference;
  const joined = scope?.joins.get(source);

  if (joined === undefined) {
    throw new QueryRefusedError({
      column,
      message:
        scope === undefined
          ? `Column "${column}" names the source "${source}", but this read has no join.`
          : `Column "${column}" names the source "${source}", which is not one of this read's joins.`,
      reason: 'join-source-unknown',
    });
  }

  assertSafeIdentifier(column);
  assertColumnAllowed({ allowedColumns: joined.allowedColumns, column });

  return {
    isJoined: true,
    name: `${source}.${column}`,
    sql: `${quoteIdentifier(joined.qualifier)}.${quoteIdentifier(column)}`,
  };
};
