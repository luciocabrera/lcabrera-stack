import type { SchemaColumn } from './queries.types.ts';

import { publicColumns } from './publicColumns.util.ts';
import {
  ALLOWED_WHOLE_JSONB,
  PUBLIC_JSONB_COLUMNS,
} from './queries.constants.ts';

export const readerColumns = (columns: readonly SchemaColumn[]) => {
  const open = publicColumns(columns);
  const wholeJsonb: readonly string[] = ALLOWED_WHOLE_JSONB;
  const publicCopies = new Set(
    Object.entries(PUBLIC_JSONB_COLUMNS).map(
      ([source, copy]) => `${source.slice(0, source.indexOf('.'))}.${copy}`,
    ),
  );

  return new Set(
    columns
      .map(({ column, table }) => `${table}.${column}`)
      .filter(
        (qualified) =>
          open.has(qualified) ||
          wholeJsonb.includes(qualified) ||
          publicCopies.has(qualified),
      ),
  );
};
