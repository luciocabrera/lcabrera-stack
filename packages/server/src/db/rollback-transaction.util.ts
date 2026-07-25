import type { TransactionClient } from './db.types.ts';

type RollbackTransactionArgs = {
  readonly client: TransactionClient;
};

/**
 * Rolls `client`'s transaction back, swallowing a failure of the ROLLBACK itself.
 *
 * Swallowing is the point, and it is not laziness. Every caller is already
 * unwinding the error that actually explains the failure; pg's own canonical
 * example (`try BEGIN … catch ROLLBACK; throw`) lets a throw from the ROLLBACK
 * replace it, and what surfaces is then "connection terminated" instead of the
 * constraint violation that caused it. A rollback fails when the connection is
 * already gone, in which case there is nothing left to roll back anyway.
 */
export const rollbackTransaction = async ({
  client,
}: RollbackTransactionArgs) => {
  try {
    await client.query('ROLLBACK');
  } catch {
    return false;
  }

  return true;
};
