import type { SchemaColumn } from './queries.types.ts';

import { isTextTyped } from './isTextTyped.util.ts';
import {
  ALLOWED_TEXT_COLUMNS,
  EXCLUDED_COLUMNS,
  EXCLUDED_TABLES,
} from './queries.constants.ts';

export const publicColumns = (columns: readonly SchemaColumn[]) => {
  const excludedTables: readonly string[] = EXCLUDED_TABLES;
  const excludedColumns: readonly string[] = EXCLUDED_COLUMNS;
  const allowedText: readonly string[] = ALLOWED_TEXT_COLUMNS;

  return new Set(
    columns
      .map((column) => ({
        ...column,
        qualified: `${column.table}.${column.column}`,
      }))
      .filter(
        (column) =>
          !excludedTables.includes(column.table) &&
          !excludedColumns.includes(column.qualified) &&
          column.dataType !== 'jsonb' &&
          (!isTextTyped(column) || allowedText.includes(column.qualified)),
      )
      .map(({ qualified }) => qualified),
  );
};
