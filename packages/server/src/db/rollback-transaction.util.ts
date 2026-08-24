import type { TransactionClient } from './db.types.ts';

type RollbackTransactionArgs = {
  readonly client: TransactionClient;
};

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
