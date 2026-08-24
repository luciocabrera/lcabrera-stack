import type { QueryResult, QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';

import { mapDbError } from '../errors/map-db-error.util.ts';
import { getPool } from './get-pool.util.ts';

type RunQueryArgs = ExecutorOptions & {
  readonly text: string;
  readonly values: readonly unknown[];
};

/**
 * getPool()` client: `Pool.query` and `ClientBase.query` are both overloaded, and
 * TypeScript cannot synthesise a call signature for a union of overloaded methods.
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
