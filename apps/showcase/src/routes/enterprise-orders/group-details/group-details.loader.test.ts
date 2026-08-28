import type { LoaderFunctionArgs } from 'react-router';

import { encodeDrillGroup } from '@lcabrera/api/olap/encode-drill-group.util';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { APP_ID } from '@/constants/app.constants';

import { selectOrdersPage } from '../.server/enterpriseOrders.service';
import {
  COLUMNS,
  GROUP_DETAILS_PERSISTENCE_KEY,
} from '../EnterpriseOrders.constants';
import { loader } from './group-details.loader';

vi.mock('../.server/enterpriseOrders.service', () => ({
  selectOrderGroupKeyTruncations: vi.fn(async () => ({})),
  selectOrdersPage: vi.fn(async () => ({ data: [], hasMore: false, total: 0 })),
}));

const GROUP_PATH = [
  { columnKey: 'product_category', value: 'Automotive' },
  { columnKey: 'product_subcategory', value: 'Exterior' },
  { columnKey: 'customer_type', value: 'Business' },
] as const;

const groupToken = encodeDrillGroup({
  group: { isSubtotal: false, path: GROUP_PATH },
  groupKeys: GROUP_PATH.map((entry) => entry.columnKey),
});

/** `APP_ID`, never a literal: `getStorageKey` namespaces every slice with it. */
const layoutCookie = ({
  slice,
  value,
}: {
  readonly slice: string;
  readonly value: unknown;
}) =>
  `table-state-${APP_ID}-${GROUP_DETAILS_PERSISTENCE_KEY}-${slice}=${encodeURIComponent(
    JSON.stringify({ value, version: 1 }),
  )}`;

const PERSISTED_ORDER = ['order_status', 'order_id'];

const persistedOrderCookie = () =>
  layoutCookie({ slice: 'columnOrder', value: PERSISTED_ORDER });

type InvokeArgs = {
  readonly cookie?: string;
  readonly group?: string;
};

const invoke = async ({ cookie, group = groupToken }: InvokeArgs = {}) =>
  loader({
    request: new Request(
      `http://localhost/enterprise-orders/group?group=${encodeURIComponent(group)}`,
      { headers: cookie === undefined ? undefined : { cookie } },
    ),
  } as LoaderFunctionArgs);

describe('group-details loader', () => {
  beforeEach(() => {
    vi.mocked(selectOrdersPage).mockClear();
  });

  describe('column layout', () => {
    const persistedLayout = [
      persistedOrderCookie(),
      layoutCookie({
        slice: 'columnPinning',
        value: { left: ['order_status'], right: [] },
      }),
      layoutCookie({ slice: 'columnSizing', value: { order_id: 400 } }),
      layoutCookie({ slice: 'columnVisibility', value: ['order_number'] }),
    ].join('; ');

    it('opens at the declared columns whatever the persisted layout holds', async () => {
      const result = await invoke({ cookie: persistedLayout });

      expect(result.metaState.isColumnLayoutTransient).toBe(true);
      expect(result.columnsState.columnOrder).toEqual([]);
      expect(result.columnsState.columnPinning).toEqual({
        left: [],
        right: [],
      });
      expect(result.columnsState.columnSizing).toEqual({});
      expect(result.columnsState.columnVisibility).toEqual(new Set());
      expect(result.columnsState.columns[0]?.key).toBe('order_id');
    });

    it('is a cookie this app really reads, so the assertion above can fail', async () => {
      const ordinaryLoader = createTableRouteLoader({
        appId: APP_ID,
        columns: [...COLUMNS],
        fetchPage: async () => ({ data: [], hasMore: false, total: 0 }),
        persistenceKey: GROUP_DETAILS_PERSISTENCE_KEY,
        tableName: 'enterprise_orders',
        title: { plural: 'Orders', singular: 'Order' },
      });

      const result = await ordinaryLoader({
        request: new Request('http://localhost/enterprise-orders', {
          headers: { cookie: persistedOrderCookie() },
        }),
      } as LoaderFunctionArgs);

      expect(result.columnsState.columnOrder).toEqual(PERSISTED_ORDER);
    });
  });

  describe('locked filters', () => {
    it('states one entry per group key, with its column label and value', async () => {
      const result = await invoke();

      expect(result.metaState.lockedFilters).toEqual({
        entries: [
          {
            columnKey: 'product_category',
            label: 'Category',
            value: 'Automotive',
          },
          {
            columnKey: 'product_subcategory',
            label: 'Subcategory',
            value: 'Exterior',
          },
          {
            columnKey: 'customer_type',
            label: 'Customer Type',
            value: 'Business',
          },
        ],
      });
    });

    it('reads the token this request carries, never one a previous read saw', async () => {
      await invoke();

      const second = await invoke({
        group: encodeDrillGroup({
          group: {
            isSubtotal: false,
            path: [{ columnKey: 'shipping_country', value: 'France' }],
          },
          groupKeys: ['shipping_country'],
        }),
      });

      expect(second.metaState.lockedFilters).toEqual({
        entries: [
          {
            columnKey: 'shipping_country',
            label: 'Ship Country',
            value: 'France',
          },
        ],
      });
    });

    it('states why an unreadable token could not be read, rather than nothing', async () => {
      const result = await invoke({ group: 'not a token' });

      expect(result.metaState.lockedFilters?.entries).toEqual([]);
      expect(result.metaState.lockedFilters?.refusal).toContain(
        'does not name a group',
      );
    });

    it('adds no ColumnFilter, and leaves the token scoping the read', async () => {
      const result = await invoke();

      expect(result.columnsState.columnFilters).toEqual({});
      expect(vi.mocked(selectOrdersPage).mock.calls[0]?.[0].filters).toEqual([
        { column: 'product_category', operator: 'eq', value: 'Automotive' },
        { column: 'product_subcategory', operator: 'eq', value: 'Exterior' },
        { column: 'customer_type', operator: 'eq', value: 'Business' },
      ]);
    });

    it('refuses the read rather than serving the whole table on a bad token', async () => {
      await invoke({ group: 'not a token' });

      expect(vi.mocked(selectOrdersPage)).not.toHaveBeenCalled();
    });

    it('states the same refusal the grid renders, on a token the row cannot answer', async () => {
      const result = await invoke({
        group: encodeDrillGroup({
          group: { isSubtotal: true, path: [...GROUP_PATH] },
          groupKeys: GROUP_PATH.map((entry) => entry.columnKey),
        }),
      });

      const page = await result.dataPromise;

      expect(result.metaState.lockedFilters?.entries).toEqual([]);
      expect(result.metaState.lockedFilters?.refusal).toBe(page.error?.message);
    });
  });
});
