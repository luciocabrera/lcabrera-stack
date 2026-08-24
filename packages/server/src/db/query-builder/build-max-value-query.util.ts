import type {
  BuiltQuery,
  MaxValueQueryDescriptor,
} from './query-builder.types.ts';

import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

export const buildMaxValueQuery = ({
  allowedColumns,
  column,
  schema,
  table,
}: MaxValueQueryDescriptor): BuiltQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);
  assertSafeIdentifier(column);
  assertColumnAllowed({ allowedColumns, column });

  const quotedColumn = quoteIdentifier(column);
  const quotedFrom = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;

  return {
    text: `SELECT COALESCE(MAX(${quotedColumn}), 0) AS max FROM ${quotedFrom}`,
    values: [],
  };
};
