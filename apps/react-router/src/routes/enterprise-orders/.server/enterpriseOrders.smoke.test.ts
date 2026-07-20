// @vitest-environment node

import { closePool } from '@repo/data-access/db/getPool.util';
import { afterAll, describe, expect, it } from 'vitest';

import { getDemoCredential } from '@/auth/getDemoCredential.util';
import { verifyCredentials } from '@/auth/verifyCredentials.util';
import {
  deleteOrder,
  getNextOrderId,
  insertOrder,
  selectOrderById,
  selectOrdersPage,
  updateOrder,
} from '@/routes/enterprise-orders/.server/enterpriseOrders.service';
import { buildValidOrderInput } from '@/routes/enterprise-orders/config/enterpriseOrders.fixtures';
import { toOrderInsertValues } from '@/routes/enterprise-orders/config/toOrderInsertValues.util';
import { toOrderUpdateValues } from '@/routes/enterprise-orders/config/toOrderUpdateValues.util';

/**
 * Live-database smoke test for the secured enterprise-orders showcase. Unlike the
 * unit suites — which mock the pg pool and fetch — this exercises the real path
 * against a running Postgres: the env-configured login credential, and a full
 * create → read → update → list/count → delete round-trip through the generic
 * `@repo/data-access` builders. It is the one check that proves the wiring works
 * end to end at runtime, which no mocked test can.
 *
 * Gated behind `SMOKE_DB` so the DB-less CI unit job (and a bare `vp run test`)
 * skips it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/react-router (sources DB_* + sets SMOKE_DB)
 *
 * The suite cleans up the single row it creates (the delete step is part of the
 * flow), so it is safe to re-run.
 */
const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

const ACTOR = 'smoke@example.com';
const DEMO_PASSWORD = 'demo-password-123';

describe.skipIf(!IS_SMOKE_ENABLED)('enterprise-orders live DB smoke', () => {
  afterAll(async () => {
    await closePool();
  });

  it('verifies the demo login credential against the env-configured hash', () => {
    const credential = getDemoCredential({ env: process.env });

    expect(
      verifyCredentials({
        credential,
        email: credential.email,
        password: DEMO_PASSWORD,
      }),
    ).toBe(true);
    expect(
      verifyCredentials({
        credential,
        email: credential.email,
        password: 'wrong-password',
      }),
    ).toBe(false);
  });

  it('round-trips an order through create → read → update → list → delete', async () => {
    const now = new Date();
    const orderId = await getNextOrderId();

    const inserted = await insertOrder({
      values: toOrderInsertValues({
        actor: ACTOR,
        input: buildValidOrderInput(),
        now,
        orderId,
      }),
    });
    expect(inserted?.order_id).toBe(orderId);
    expect(inserted?.last_modified_by).toBe(ACTOR);

    const created = await selectOrderById(orderId);
    expect(created?.customer_name).toBe('Ada Lovelace');

    const updated = await updateOrder({
      orderId,
      values: toOrderUpdateValues({
        actor: ACTOR,
        input: { ...buildValidOrderInput(), customer_name: 'Grace Hopper' },
        now,
      }),
    });
    expect(updated?.customer_name).toBe('Grace Hopper');

    const page = await selectOrdersPage({
      filters: [{ column: 'order_id', operator: 'eq', value: orderId }],
      limit: 10,
      offset: 0,
      sort: [{ column: 'order_id', direction: 'asc' }],
    });
    expect(page.total).toBe(1);
    expect(page.data[0]?.order_id).toBe(orderId);

    await deleteOrder(orderId);
    expect(await selectOrderById(orderId)).toBeUndefined();
  });
});
