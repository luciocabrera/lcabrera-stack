import type { ClientBase } from 'pg';

export type ExecutorOptions = {
  readonly tx?: TransactionClient;
};

/**
 * Deliberately **not** `PoolClient`: `release()` belongs to whoever acquired the
 * connection, and a callback able to release the client handed to it can pull the
 * connection out from under the transaction wrapping it.
 */
export type TransactionClient = ClientBase;
