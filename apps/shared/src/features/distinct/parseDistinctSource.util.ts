import { resolveFilterOptionsSource } from '@lcabrera/server/filters/resolve-filter-options-source.util';

import { HttpError } from '../../errors/httpError.js';
import { DISTINCT_SOURCES } from './distinct.constants.js';

type ParseDistinctSourceArgs = {
  readonly columnName: string;
  readonly schemaName: string;
  readonly tableName: string;
};

/**
 * The HTTP edge of `@lcabrera/server`'s `resolveFilterOptionsSource`: validates
 * a distinct-values request against the DISTINCT_SOURCES allow-list BEFORE any
 * SQL composition, and turns a refusal into the 400 this API answers with — an
 * unknown schema/table pair and a column not allow-listed for that source are
 * reported apart. The lookup is the package's; the registry is ours.
 *
 * Returns the validated identifiers plus the source's allowed columns and the
 * column's type, so the query builder can enforce the same list as defense in
 * depth.
 */
export const parseDistinctSource = ({
  columnName,
  schemaName,
  tableName,
}: ParseDistinctSourceArgs) => {
  const source = resolveFilterOptionsSource({
    column: columnName,
    schema: schemaName,
    sources: DISTINCT_SOURCES,
    table: tableName,
  });

  if (!source.allowed) {
    throw new HttpError({
      message:
        source.refusal === 'unknown-source'
          ? `Unsupported distinct source: ${schemaName}.${tableName}`
          : `Unsupported distinct column: ${columnName}`,
      statusCode: 400,
    });
  }

  return {
    allowedColumns: source.allowedColumns,
    columnName,
    columnType: source.columnType,
    schemaName,
    tableName,
  };
};
