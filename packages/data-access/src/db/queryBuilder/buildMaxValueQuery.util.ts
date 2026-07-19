import type {
  BuiltQuery,
  MaxValueQueryDescriptor,
} from './QueryBuilder.types.ts';

import { assertColumnAllowed } from './assertColumnAllowed.util.ts';
import { assertSafeIdentifier } from './assertSafeIdentifier.util.ts';
import { quoteIdentifier } from './quoteIdentifier.util.ts';

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
