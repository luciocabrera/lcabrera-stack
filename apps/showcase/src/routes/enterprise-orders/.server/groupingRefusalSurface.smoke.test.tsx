// @vitest-environment jsdom

/**
 * What a user sees after picking a group key the live catalogue refuses.
 *
 * Which columns are legal group keys is decided by `pg_stats` and the column's
 * real Postgres type (ADR-058), so a hand-written capability map proves only
 * that the component renders whatever it was handed. The route is driven end to
 * end — its real loader against the URL a grouping selection produces, its real
 * component in a memory router, nothing between the catalogue and the screen
 * substituted.
 *
 * The route URL is written out rather than built with the UI's serializer, which
 * is not a published subpath — and is the hand-edited form ADR-061 requires to
 * degrade rather than crash. A codec change refuses the param and turns grouping
 * off, so every case fails rather than passing against an ungrouped table.
 *
 * Gated behind `SMOKE_DB`, so the DB-less CI unit job and a bare `vp run test`
 * skip it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/showcase (sources DB_* + sets SMOKE_DB)
 */

import type { TableColumnGroupingCapability } from '@lcabrera/ui/components/Table/Table.types';

import { closePool } from '@lcabrera/server/db/get-pool.util';
import { MAX_GROUP_ROWS_REFUSE } from '@lcabrera/server/db/group-query-builder/group-query-builder.constants';
import { NotificationProvider } from '@lcabrera/ui/contexts/NotificationContext';
import { act, cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from 'vite-plus/test';

import { loader } from '@/routes/enterprise-orders/enterprise-orders.loader';
import { EnterpriseOrders } from '@/routes/enterprise-orders/EnterpriseOrders.component';
import { COLUMNS } from '@/routes/enterprise-orders/EnterpriseOrders.constants';

import { selectOrderGroupingCapabilities } from './enterpriseOrders.service';

const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

const OFFERED_COLUMN_KEYS = COLUMNS.map((column) => String(column.key));

const labelOf = (columnKey: string) =>
  COLUMNS.find((column) => String(column.key) === columnKey)?.label ??
  columnKey;

const loadRoute = async (groupKeys: readonly string[]) => {
  const search =
    groupKeys.length === 0
      ? ''
      : `?grouping=${encodeURIComponent(JSON.stringify({ keys: groupKeys }))}`;

  return loader({
    context: undefined,
    params: {},
    request: new Request(`http://localhost/enterprise-orders${search}`),
  } as unknown as Parameters<typeof loader>[0]);
};

const renderRoute = async (loaderData: Awaited<ReturnType<typeof loader>>) => {
  const router = createMemoryRouter(
    [
      {
        element: (
          <NotificationProvider>
            <EnterpriseOrders />
          </NotificationProvider>
        ),
        loader: () => loaderData,
        path: '/enterprise-orders',
      },
    ],
    { initialEntries: ['/enterprise-orders'] },
  );

  await act(async () => {
    render(<RouterProvider router={router} />);
  });
};

describe.skipIf(!IS_SMOKE_ENABLED)(
  'a group key the live catalogue refuses',
  () => {
    let capabilities: Readonly<Record<string, TableColumnGroupingCapability>> =
      {};
    let refusedKeys: readonly string[] = [];
    let allowedKeys: readonly string[] = [];

    beforeAll(async () => {
      capabilities = await selectOrderGroupingCapabilities();
      refusedKeys = OFFERED_COLUMN_KEYS.filter(
        (key) => capabilities[key]?.canGroup === false,
      );
      allowedKeys = OFFERED_COLUMN_KEYS.filter(
        (key) => capabilities[key]?.canGroup === true,
      );
    });

    afterAll(async () => {
      await closePool();
    });

    afterEach(cleanup);

    it('finds both refused and legal columns among the ones the table offers', () => {
      expect(refusedKeys.length).toBeGreaterThan(0);
      expect(allowedKeys.length).toBeGreaterThan(0);
    });

    it('resolves the loader rather than rejecting it, for every refused column', async () => {
      const outcomes = await Promise.all(
        refusedKeys.map(async (key) => {
          const { dataPromise } = await loadRoute([key]);

          return { key, response: await dataPromise };
        }),
      );

      for (const { key, response } of outcomes) {
        expect(response.error?.kind).toBe('grouping-refused');
        expect(response.data).toEqual([]);
        expect(structuredClone(response.error)).toEqual(response.error);
        expect(response.error?.message).toContain(key);
      }
    });

    it('tells the user which column was refused, and offers a way out', async () => {
      const columnKey = refusedKeys[0] ?? '';
      const loaderData = await loadRoute([columnKey]);

      expect(loaderData.metaState.groupingKeys).toEqual([columnKey]);

      await renderRoute(loaderData);

      expect(
        screen.getByRole('heading', {
          name: `Grouping by ${labelOf(columnKey)} was refused`,
        }),
      ).not.toBeNull();
      expect(
        screen.getByText((text) => text.includes(columnKey)),
      ).not.toBeNull();
      expect(
        screen.getByRole('button', { name: 'Clear grouping' }),
      ).not.toBeNull();

      expect(
        screen.queryByText(/No records match the current view/),
      ).toBeNull();
    });

    it('renders groups rather than a refusal for a column the catalogue allows', async () => {
      const loaderData = await loadRoute([allowedKeys[0] ?? '']);
      const response = await loaderData.dataPromise;

      expect(response.error).toBeUndefined();
      expect(response.data.length).toBeGreaterThan(0);

      await renderRoute(loaderData);

      expect(screen.queryByText(/was refused/)).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'Clear grouping' }),
      ).toBeNull();
      expect(
        screen.queryByText(/No records match the current view/),
      ).toBeNull();
    });

    it('refuses a legal-per-column combination on its row bound, naming the widest key', async () => {
      const byWidth = [...allowedKeys].toSorted(
        (a, b) =>
          (capabilities[b]?.distinctEstimate ?? 0) -
          (capabilities[a]?.distinctEstimate ?? 0),
      );
      const keys = [byWidth[0] ?? '', byWidth[1] ?? '', byWidth.at(-1) ?? ''];
      const bound = keys.reduce(
        (product, key) => product * (capabilities[key]?.distinctEstimate ?? 1),
        1,
      );

      expect(new Set(keys).size).toBe(3);
      expect(bound).toBeGreaterThan(MAX_GROUP_ROWS_REFUSE);

      const loaderData = await loadRoute(keys);
      const response = await loaderData.dataPromise;

      expect(response.error?.kind).toBe('grouping-refused');

      const error = response.error;

      if (error?.kind !== 'grouping-refused')
        throw new Error('expected a grouping refusal');

      expect(error.reason).toBe('estimate-too-large');
      expect(error.estimatedRows).toBeGreaterThan(MAX_GROUP_ROWS_REFUSE);
      expect(error.column).toBe(keys[0]);
      expect(error.column).not.toBe(keys.at(-1));

      await renderRoute(loaderData);

      expect(
        screen.getByRole('heading', { name: 'This grouping was refused' }),
      ).not.toBeNull();
      expect(
        screen.queryByRole('heading', {
          name: (name) => name.startsWith('Grouping by '),
        }),
      ).toBeNull();
      expect(
        screen.getByText((text) => text.includes('widest group key')),
      ).not.toBeNull();
      expect(
        screen.getByRole('button', { name: 'Clear grouping' }),
      ).not.toBeNull();
    });

    it('ships the catalogue verdict to the client for every offered column', async () => {
      const { metaState } = await loadRoute([]);

      for (const key of refusedKeys) {
        expect(metaState.groupingCapabilities[key]?.canGroup).toBe(false);
        expect(metaState.groupingCapabilities[key]?.refusal).toBeDefined();
      }

      for (const key of allowedKeys) {
        expect(metaState.groupingCapabilities[key]?.canGroup).toBe(true);
      }
    });
  },
);
