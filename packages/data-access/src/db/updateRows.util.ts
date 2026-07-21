import type { QueryResultRow } from 'pg';

import type { UpdateQueryDescriptor } from './queryBuilder/queryBuilder.types.ts';

import { getPool } from './getPool.util.ts';
import { buildUpdateQuery } from './queryBuilder/buildUpdateQuery.util.ts';

/**
 * Builds `descriptor` into an UPDATE and runs it on the pool singleton.
 * Defaults to `RETURNING *` so the updated row(s) come back without the caller
 * enumerating columns; pass an explicit `returning` to narrow the projection.
 * The builder refuses an unfiltered UPDATE, so a WHERE clause is always
 * present. Same `TRow` contract and `readonly` widening as selectRows.
 */
export const updateRows = async <TRow extends QueryResultRow>(
  descriptor: UpdateQueryDescriptor,
): Promise<readonly TRow[]> => {
  const { text, values } = buildUpdateQuery({
    ...descriptor,
    returning: descriptor.returning ?? ['*'],
  });
  const result = await getPool().query<TRow>(text, [...values]);

  return result.rows;
};
