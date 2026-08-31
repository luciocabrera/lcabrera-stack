import type {
  BuiltQuery,
  CountQueryDescriptor,
} from './query-builder.types.ts';

import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { buildWhereClause } from './build-where-clause.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

export const buildCountQuery = ({
  allowedColumns,
  column,
  filters,
  schema,
  table,
}: CountQueryDescriptor): BuiltQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);

  if (column !== undefined) {
    assertSafeIdentifier(column);
    assertColumnAllowed({ allowedColumns, column });
  }

  const countTarget = column === undefined ? '*' : quoteIdentifier(column);
  const whereClause = buildWhereClause({ allowedColumns, filters });
  const quotedFrom = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;

  const text = [
    `SELECT count(${countTarget}) AS count FROM ${quotedFrom}`,
    whereClause.text,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  return { text, values: whereClause.values };
};
