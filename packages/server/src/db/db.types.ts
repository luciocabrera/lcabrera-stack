import type { ClientBase } from 'pg';

/**
 * The optional transaction seam every executor accepts.
 *
 * It lives here rather than on the descriptors in `query-builder/` on purpose:
 * that folder is the pure half of `db/` and knows nothing about connections (its
 * `ARCHITECTURE.md` forbids even importing `getPool`). A descriptor says *what*
 * SQL to run; `tx` says *where* to run it — two different questions, kept in two
 * different types. Omit it and the executor uses the pool singleton, which is why
 * every pre-existing caller is unaffected.
 */
export type ExecutorOptions = {
  readonly tx?: TransactionClient;
};

/**
 * A connection an executor can run on.
 *
 * `ClientBase` is pg's own common base of `Client` and `PoolClient`, so a client
 * the caller opened itself and one borrowed from the pool both fit. Deliberately
 * **not** `PoolClient`: `release()` belongs to whoever acquired the connection,
 * and a callback able to release the client handed to it can pull the connection
 * out from under the transaction wrapping it.
 */
export type TransactionClient = ClientBase;
