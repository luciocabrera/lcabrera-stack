import type { QueryResult, QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';

import { mapDbError } from '../errors/map-db-error.util.ts';
import { getPool } from './get-pool.util.ts';

type RunQueryArgs = ExecutorOptions & {
  readonly text: string;
  readonly values: readonly unknown[];
};

/**
 * The single place a built query meets a connection.
 *
 * It does the two things every executor must not forget: pick the caller's
 * transaction client when there is one and the pool singleton otherwise, and
 * translate any driver rejection through `mapDbError` so no consumer ever sees a
 * raw `pg` message. Each executor used to call `getPool().query` itself, which is
 * six copies of both behaviours and six chances to omit one.
 *
 * The two branches are spelled out rather than resolved into one `tx ?? getPool()`
 * client: `Pool.query` and `ClientBase.query` are both overloaded, and TypeScript
 * cannot synthesise a call signature for a union of overloaded methods.
 */
export const runQuery = async <TRow extends QueryResultRow>({
  text,
  tx,
  values,
}: RunQueryArgs): Promise<QueryResult<TRow>> => {
  try {
    return tx === undefined
      ? await getPool().query<TRow>(text, [...values])
      : await tx.query<TRow>(text, [...values]);
  } catch (error) {
    throw mapDbError(error);
  }
};
