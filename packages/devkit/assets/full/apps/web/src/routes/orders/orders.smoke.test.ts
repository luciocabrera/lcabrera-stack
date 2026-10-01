/**
 * Drives this route's loader, its page endpoint, its drill-down loader and its
 * delete action against the seeded table, and holds each answer to what a
 * plain SQL query over the same rows returns. Every other test run skips it:
 * it gates itself on `SMOKE_DB`, which only this workspace's `test:smoke` task
 * sets.
 */

import type { LoaderFunctionArgs } from 'react-router';

import { encodeDrillGroup } from '@lcabrera/api/olap/encode-drill-group.util';
import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import type { OrderRow, OrdersPage } from './orders.types';

import { action } from '../api/orders-delete/root';
import { loader as pageLoader } from '../api/orders-page/root';
import { loader as groupLoader } from './group/group.loader';
import { PAGE_LIMIT, TABLE_NAME } from './Orders.constants';
import { loader } from './orders.loader';

const IS_SMOKE_ENABLED = Boolean(import.meta.env.SMOKE_DB);

const SCRATCH_ORDER_ID = 2_000_000_001;

const param = (value: unknown) => encodeURIComponent(JSON.stringify(value));

type RequestArgs = {
  readonly init?: RequestInit;
  readonly path: string;
};

const asArgs = ({ init, path }: RequestArgs) =>
  ({
    request: new Request(`http://localhost${path}`, init),
  }) as LoaderFunctionArgs;

const firstPage = async (search: string) => {
  const result = await loader(asArgs({ path: `/${search}` }));
  return result.dataPromise;
};

const idsOf = (rows: readonly OrderRow[]) => rows.map((row) => row.order_id);

const firstIds = async (search: string) => {
  const page = await firstPage(search);
  return idsOf(page.data);
};

type IdRow = { readonly order_id: number };

type SelectIdsArgs = {
  readonly sql: string;
  readonly values?: readonly unknown[];
};

const selectIds = async ({ sql, values = [] }: SelectIdsArgs) => {
  const { rows } = await getPool().query(sql, [...values]);
  return rows.map((row: IdRow) => row.order_id);
};

const BY_TOTAL = `ORDER BY total_amount DESC, order_id ASC`;

describe.skipIf(!IS_SMOKE_ENABLED)(
  'the orders route over the seeded table',
  () => {
    afterAll(async () => {
      await getPool().query(`DELETE FROM ${TABLE_NAME} WHERE order_id = $1`, [
        SCRATCH_ORDER_ID,
      ]);
      await closePool();
    });

    it('answers a sorted request in the order ORDER BY gives', async () => {
      expect(
        await firstIds(`?sorting=${param({ total_amount: 'desc' })}`),
      ).toEqual(
        await selectIds({
          sql: `SELECT order_id FROM ${TABLE_NAME} ${BY_TOTAL} LIMIT $1`,
          values: [PAGE_LIMIT],
        }),
      );
    });

    it('answers a filtered request with only the rows the filter matches', async () => {
      const page = await firstPage(
        `?filters=${param({ order_status: ['eq', 'Delivered'] })}`,
      );
      const matching = await selectIds({
        sql: `SELECT order_id FROM ${TABLE_NAME} WHERE order_status = 'Delivered' ORDER BY order_id`,
      });

      expect(matching.length).toBeGreaterThan(0);
      expect(page.total).toBe(matching.length);
      expect(idsOf(page.data)).toEqual(matching.slice(0, PAGE_LIMIT));
    });

    it('continues the same order on the next page, from the keyset cursor', async () => {
      const first = await firstPage(
        `?sorting=${param({ total_amount: 'desc' })}`,
      );
      const last = first.data.at(-1);
      const sort = [
        { columnKey: 'total_amount', direction: 'desc' },
        { columnKey: 'order_id', direction: 'asc' },
      ];
      const cursor = param([last?.total_amount, last?.order_id]);
      const response = await pageLoader(
        asArgs({
          path: `/_api/orders/page?limit=${PAGE_LIMIT}&skip=${PAGE_LIMIT}&sort=${param(sort)}&cursor=${cursor}`,
        }),
      );
      const next = (await response.json()) as OrdersPage;

      expect(idsOf(next.data)).toEqual(
        await selectIds({
          sql: `SELECT order_id FROM ${TABLE_NAME} ${BY_TOTAL} OFFSET $1 LIMIT $1`,
          values: [PAGE_LIMIT],
        }),
      );
    });

    it('groups the rows, and drills into one group’s rows', async () => {
      const grouped = await firstPage(
        `?grouping=${param({ keys: ['order_status'] })}`,
      );
      const group = grouped.data
        .map((row) => row.tableGroup)
        .find((summary) => summary !== undefined && !summary.isSubtotal);

      expect(group).toBeDefined();
      if (group === undefined) return;

      const token = encodeDrillGroup({ group, groupKeys: ['order_status'] });
      const detail = await groupLoader(
        asArgs({ path: `/group?group=${encodeURIComponent(token)}` }),
      );
      const drilled = await detail.dataPromise;
      const [entry] = group.path;

      expect(drilled.total).toBe(group.count);
      expect(
        drilled.data.every((row) => row.order_status === entry?.value),
      ).toBe(true);
    });

    it('deletes a row through the action, and the next read no longer has it', async () => {
      await getPool().query(
        `INSERT INTO ${TABLE_NAME}
       SELECT (jsonb_populate_record(o, jsonb_build_object('order_id', $1::integer))).*
       FROM ${TABLE_NAME} o ORDER BY o.order_id LIMIT 1`,
        [SCRATCH_ORDER_ID],
      );
      const byId = `?filters=${param({ order_id: ['eq', SCRATCH_ORDER_ID] })}`;

      expect(await firstIds(byId)).toEqual([SCRATCH_ORDER_ID]);

      const body = new URLSearchParams({
        id: String(SCRATCH_ORDER_ID),
        intent: 'delete',
      });
      const response = await action(
        asArgs({
          init: { body, method: 'POST' },
          path: '/_action/orders/delete',
        }),
      );

      expect(response.status).toBe(200);
      expect(await firstIds(byId)).toEqual([]);
    });
  },
);
