// @vitest-environment jsdom

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

/**
 * What a user sees after picking a group key the **live catalogue** refuses.
 *
 * This is the one check a mocked capability map cannot make. Which of this
 * table's columns are legal group keys is decided by `pg_stats` and the column's
 * real Postgres type (ADR-058), so a hand-written map proves only that the
 * component renders whatever it was handed — the question here is whether it
 * renders what the *database* actually says, for the columns the database
 * actually refuses. Both halves run against the seeded `enterprise_orders`.
 *
 * The route is driven end to end: its real `loader` is called with the URL a
 * grouping selection produces, and the resolved data is handed to the real route
 * component inside a memory router. Nothing between the catalogue and the screen
 * is substituted.
 *
 * Gated behind `SMOKE_DB` like its siblings, so the DB-less CI unit job and a
 * bare `vp run test` skip it:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/react-router (sources DB_* + sets SMOKE_DB)
 */
const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

/** Every column the header menu offers a group-by entry for. */
const OFFERED_COLUMN_KEYS = COLUMNS.map((column) => String(column.key));

const labelOf = (columnKey: string) =>
  COLUMNS.find((column) => String(column.key) === columnKey)?.label ??
  columnKey;

/**
 * The route URL a grouping selection produces. Written out rather than built
 * with the UI's serializer, which is not a published subpath — and this is also
 * the hand-edited form ADR-061 requires to degrade rather than crash, so it is
 * the honest input either way. If the codec's shape ever moved, the param would
 * be refused and grouping would simply be off, so every case below fails rather
 * than passing against a table that was never grouped; `groupingKeys` is
 * asserted on the loader meta to say so directly.
 */
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

  // Awaited: the table streams its rows through `use()`, and an un-awaited
  // `act` leaves the tree parked on the Suspense fallback forever.
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
      // The precondition every case below rests on, asserted rather than
      // assumed: with no refused column the refusal cases would pass by
      // testing nothing, and with no legal one the control case would.
      expect(refusedKeys.length).toBeGreaterThan(0);
      expect(allowedKeys.length).toBeGreaterThan(0);
    });

    it('resolves the loader rather than rejecting it, for every refused column', async () => {
      // The acceptance bar: no selection may produce an error page. A rejected
      // `dataPromise` is exactly what the route error boundary renders, so this
      // is the whole refusal set proved not to reach it.
      const outcomes = await Promise.all(
        refusedKeys.map(async (key) => {
          const { dataPromise } = await loadRoute([key]);

          return { key, response: await dataPromise };
        }),
      );

      for (const { key, response } of outcomes) {
        expect(response.error?.kind).toBe('grouping-refused');
        expect(response.data).toEqual([]);
        // Plain data all the way through, or the client gets a shape it cannot
        // branch on (ADR-050).
        expect(structuredClone(response.error)).toEqual(response.error);
        expect(response.error?.message).toContain(key);
      }
    });

    it('tells the user which column was refused, and offers a way out', async () => {
      const columnKey = refusedKeys[0] ?? '';
      const loaderData = await loadRoute([columnKey]);

      // The precondition: the URL really did apply this grouping. Without it a
      // param the codec refused would render an ordinary flat table, and the
      // assertions below would fail for a reason that has nothing to do with
      // the refusal surface.
      expect(loaderData.metaState.groupingKeys).toEqual([columnKey]);

      await renderRoute(loaderData);

      // What a user sees: the refused column under its header label, the
      // endpoint's own reason, and the one action that resolves it.
      expect(
        screen.getByRole('heading', {
          name: `Grouping by ${labelOf(columnKey)} was refused`,
        }),
      ).not.toBeNull();
      // A matcher function rather than a built `RegExp`: the column key is a
      // runtime value, and a pattern spliced from one is both a lint finding
      // and a needless escaping question.
      expect(
        screen.getByText((text) => text.includes(columnKey)),
      ).not.toBeNull();
      expect(
        screen.getByRole('button', { name: 'Clear grouping' }),
      ).not.toBeNull();

      // The defect this closes, stated as its own assertion: an empty table
      // explaining itself as a filter mismatch.
      expect(
        screen.queryByText(/No records match the current view/),
      ).toBeNull();
    });

    it('renders groups rather than a refusal for a column the catalogue allows', async () => {
      // The control. Without it "the refusal is on screen" would also pass for
      // a component that showed the refusal unconditionally.
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
      // Every key here passes the per-column gate, so the menu offers all three
      // and this refusal is one no client-side gate could have predicted — the
      // bound is the product, which belongs to no single column. That is why
      // suppressing menu entries cannot be the whole answer (ADR-067).
      //
      // The keys are chosen from the **live** estimates, widest first, so the
      // key the endpoint names is deliberately *not* the one added last.
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

      // Preconditions, asserted rather than assumed: three distinct keys the
      // catalogue accepts individually, whose product clears the ceiling. If
      // the fixture ever changes so it does not, this fails here rather than
      // turning the assertions below into a test of nothing.
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
      // The widest key, which is the actionable one — and *not* the key added
      // last, which is the surprise this pins.
      expect(error.column).toBe(keys[0]);
      expect(error.column).not.toBe(keys.at(-1));

      await renderRoute(loaderData);

      // So the heading must not say "Grouping by <widest> was refused": that
      // column was already applied and is legal on its own. The endpoint's
      // sentence still names it, in the role it actually plays.
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
      // The menu is built from this map, so it is what decides whether a
      // refused key can be picked at all. Asserting it on the *loader meta*
      // rather than on the service is the point: the client sees only this.
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
