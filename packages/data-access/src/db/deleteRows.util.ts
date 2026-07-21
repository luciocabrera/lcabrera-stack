import type { QueryResultRow } from 'pg';

import type { DeleteQueryDescriptor } from './queryBuilder/queryBuilder.types.ts';

import { getPool } from './getPool.util.ts';
import { buildDeleteQuery } from './queryBuilder/buildDeleteQuery.util.ts';

/**
 * Builds `descriptor` into a DELETE and runs it on the pool singleton.
 * Defaults to `RETURNING *` so the deleted row(s) come back without the caller
 * enumerating columns; pass an explicit `returning` to narrow the projection.
 * The builder refuses an unfiltered DELETE, so a WHERE clause is always
 * present. Same `TRow` contract and `readonly` widening as selectRows.
 */
export const deleteRows = async <TRow extends QueryResultRow>(
  descriptor: DeleteQueryDescriptor,
): Promise<readonly TRow[]> => {
  const { text, values } = buildDeleteQuery({
    ...descriptor,
    returning: descriptor.returning ?? ['*'],
  });
  const result = await getPool().query<TRow>(text, [...values]);

  return result.rows;
};
