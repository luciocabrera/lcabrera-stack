import type {
  BuiltQuery,
  MaxValueQueryDescriptor,
} from './query-builder.types.ts';

import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

/**
 * Builds `SELECT COALESCE(MAX(col), 0) AS max FROM schema.table` — the generic
 * "next id" primitive for tables whose primary key has no sequence or default
 * (e.g. enterprise_orders' plain-integer order_id). Fully table/column
 * agnostic; the caller adds 1 to assign the next id. Same identifier model as
 * the other builders: schema/table/column always pass assertSafeIdentifier,
 * and `allowedColumns` opts into the membership check.
 */
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
