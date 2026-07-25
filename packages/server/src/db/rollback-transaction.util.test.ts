import { describe, expect, it, vi } from 'vite-plus/test';

import type { TransactionClient } from './db.types.ts';

import { rollbackTransaction } from './rollback-transaction.util.ts';

const clientWith = (query: ReturnType<typeof vi.fn>) =>
  ({ query }) as unknown as TransactionClient;

describe('rollbackTransaction', () => {
  it('issues ROLLBACK and reports success', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });

    await expect(
      rollbackTransaction({ client: clientWith(query) }),
    ).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('swallows a failing ROLLBACK so it cannot mask the error being unwound', async () => {
    const query = vi.fn().mockRejectedValue(new Error('connection terminated'));

    await expect(
      rollbackTransaction({ client: clientWith(query) }),
    ).resolves.toBe(false);
  });
});
