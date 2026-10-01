/**
 * Reads the seeded table back through the published server package, against a
 * running database. Every other test run skips it: it gates itself on
 * `SMOKE_DB`, which only this workspace's `test:smoke` task sets.
 */

import { closePool } from '@lcabrera/server/db/get-pool.util';
import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { afterAll, describe, expect, it } from 'vite-plus/test';

const IS_SMOKE_ENABLED = Boolean(import.meta.env.SMOKE_DB);

const SEEDED_ROWS = 1000;

const TABLE = { schema: 'public', table: 'enterprise_orders' };

describe.skipIf(!IS_SMOKE_ENABLED)('the seeded enterprise_orders table', () => {
  afterAll(async () => {
    await closePool();
  });

  it('holds every row the seed writes', async () => {
    expect(await getRowsCount({ ...TABLE, column: 'order_id' })).toBe(
      SEEDED_ROWS,
    );
  });

  it('answers a filtered count from the same rows', async () => {
    const delivered = await getRowsCount({
      ...TABLE,
      column: 'order_id',
      filters: [{ column: 'order_status', operator: 'eq', value: 'Delivered' }],
    });

    expect(delivered).toBeGreaterThan(0);
    expect(delivered).toBeLessThan(SEEDED_ROWS);
  });
});
