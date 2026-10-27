import type {
  BuiltQuery,
  CountQueryDescriptor,
} from './query-builder.types.ts';

import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { buildWhereClause } from './build-where-clause.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';
import { resolveColumnReference } from './resolve-column-reference.util.ts';
import { resolveReadScope } from './resolve-read-scope.util.ts';

export const buildCountRead = ({
  allowedColumns,
  column,
  filters,
  joins,
  relations,
  schema,
  table,
}: CountQueryDescriptor): BuiltQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);

  const scope = resolveReadScope({
    allowedColumns,
    joins,
    relations,
    schema,
    table,
  });
  const countTarget =
    column === undefined
      ? '*'
      : resolveColumnReference({ allowedColumns, reference: column, scope })
          .sql;
  const whereClause = buildWhereClause({ allowedColumns, filters, scope });
  const quotedFrom =
    scope?.from ?? `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;

  const text = [
    `SELECT count(${countTarget}) AS count FROM ${quotedFrom}`,
    whereClause.text,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  return { text, values: whereClause.values };
};
