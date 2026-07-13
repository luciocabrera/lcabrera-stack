import { HttpError } from '../../errors/httpError.js';
import { DISTINCT_SOURCES } from './distinct.constants.js';

type ParseDistinctSourceArgs = {
  readonly columnName: string;
  readonly schemaName: string;
  readonly tableName: string;
};

/**
 * Validates a distinct-values request against the DISTINCT_SOURCES
 * allow-list BEFORE any SQL composition. Throws HttpError 400 on an unknown
 * schema/table pair or a column not allow-listed for that source. Returns
 * the validated identifiers plus the source's allowed columns so the query
 * builder can enforce the same list as defense in depth.
 */
export const parseDistinctSource = ({
  columnName,
  schemaName,
  tableName,
}: ParseDistinctSourceArgs) => {
  const sourceKey = `${schemaName}.${tableName}`;
  const allowedColumnsSet = DISTINCT_SOURCES[sourceKey];

  if (!allowedColumnsSet) {
    throw new HttpError({
      message: `Unsupported distinct source: ${sourceKey}`,
      statusCode: 400,
    });
  }

  if (!allowedColumnsSet.has(columnName)) {
    throw new HttpError({
      message: `Unsupported distinct column: ${columnName}`,
      statusCode: 400,
    });
  }

  return {
    allowedColumns: [...allowedColumnsSet],
    columnName,
    schemaName,
    tableName,
  };
};
