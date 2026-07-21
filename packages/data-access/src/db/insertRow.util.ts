import type { QueryResultRow } from 'pg';

import type { InsertQueryDescriptor } from './queryBuilder/queryBuilder.types.ts';

import { getPool } from './getPool.util.ts';
import { buildInsertQuery } from './queryBuilder/buildInsertQuery.util.ts';

/**
 * Builds `descriptor` into an INSERT and runs it on the pool singleton — the
 * write-side twin of selectRows. Defaults to `RETURNING *` so the inserted
 * row(s) come back without the caller enumerating columns; pass an explicit
 * `returning` on the descriptor to narrow the projection.
 *
 * `TRow` is the same unchecked contract selectRows documents — pg does not
 * validate it, and `numeric` columns arrive as strings. The array is widened
 * to `readonly` deliberately: pg hands back a mutable array nothing should
 * write to.
 */
export const insertRow = async <TRow extends QueryResultRow>(
  descriptor: InsertQueryDescriptor,
): Promise<readonly TRow[]> => {
  const { text, values } = buildInsertQuery({
    ...descriptor,
    returning: descriptor.returning ?? ['*'],
  });
  const result = await getPool().query<TRow>(text, [...values]);

  return result.rows;
};
