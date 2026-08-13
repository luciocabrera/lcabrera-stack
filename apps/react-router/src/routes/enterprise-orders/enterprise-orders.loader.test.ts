import type { LoaderFunctionArgs } from 'react-router';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { selectOrdersPage } from './.server/enterpriseOrders.service';
import { loader } from './enterprise-orders.loader';

vi.mock('./.server/enterpriseOrders.service', () => ({
  selectOrderGroupingCapabilities: vi.fn(async () => ({
    total_amount: {
      aggregates: ['avg', 'sum'],
      canGroup: false,
      column: 'total_amount',
      refusal: 'too-many-distinct',
      role: 'fact',
      typeName: 'numeric',
    },
  })),
  selectOrdersPage: vi.fn(async () => ({ data: [], hasMore: false, total: 0 })),
}));

type CollectFunctionPathsArgs = {
  readonly path?: string;
  readonly value: unknown;
};

const collectFunctionPaths = ({
  path = '$',
  value,
}: CollectFunctionPathsArgs): readonly string[] => {
  if (typeof value === 'function') return [path];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectFunctionPaths({ path: `${path}[${index}]`, value: item }),
    );
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) =>
      collectFunctionPaths({ path: `${path}.${key}`, value: entry }),
    );
  }
  return [];
};

const invokeLoader = async (search = '') =>
  loader({
    request: new Request(`http://localhost/enterprise-orders${search}`),
  } as LoaderFunctionArgs);

const NO_GROUPING = { aggregates: {}, keys: [] };

const sortKeys = (value: object) =>
  Object.keys(value).toSorted((a, b) => a.localeCompare(b));

const groupingSearch = (param: string) =>
  `?grouping=${encodeURIComponent(param)}`;

beforeEach(() => {
  vi.mocked(selectOrdersPage).mockClear();
});

describe('enterprise-orders loader', () => {
  // Single-fetch serialization silently replaces functions with undefined on
  // the client (SingleFetchFallback), so everything the loader returns —
  // including the descriptor-bearing columns — must be function-free.
  it('returns fully serializable columnsState (columns included) and metaState', async () => {
    const result = await invokeLoader();

    expect(collectFunctionPaths({ value: result.columnsState })).toEqual([]);
    expect(collectFunctionPaths({ value: result.metaState })).toEqual([]);
  });

  it('bakes distinct descriptors with loader transport onto filterable string columns', async () => {
    const { columnsState } = await invokeLoader();
    const { columns } = columnsState;

    const orderNumber = columns.find((column) => column.key === 'order_number');
    expect(orderNumber?.filterOptionsDescriptor).toEqual({
      kind: 'distinct',
      params: {
        columnName: 'order_number',
        schemaName: 'public',
        tableName: 'enterprise_orders',
      },
      transport: 'loader',
    });

    const customerName = columns.find(
      (column) => column.key === 'customer_name',
    );
    expect(customerName?.filterOptionsDescriptor?.kind).toBe('distinct');
  });

  it('keeps static descriptors on enum columns and none on non-string columns', async () => {
    const { columnsState } = await invokeLoader();
    const { columns } = columnsState;

    const orderStatus = columns.find((column) => column.key === 'order_status');
    expect(orderStatus?.filterOptionsDescriptor).toEqual({
      kind: 'static',
      values: [
        'Cancelled',
        'Delivered',
        'On Hold',
        'Pending',
        'Processing',
        'Refunded',
        'Returned',
        'Shipped',
      ],
    });

    const orderId = columns.find((column) => column.key === 'order_id');
    expect(orderId?.filterOptionsDescriptor).toBeUndefined();
  });

  // The route's whole grouping opt-in is `isGroupingEnabled: true` on its
  // loader meta (ADR-063). Everything below is a consequence of that one flag.
  describe('grouping', () => {
    it('declares the capability so the table offers grouping at all', async () => {
      const { metaState } = await invokeLoader();

      expect(metaState.isGroupingEnabled).toBe(true);
    });

    it('applies a group key from the URL, so a shared link restores it', async () => {
      // A cold Request with nothing but the URL — the fresh-tab case: no
      // cookies, no client state, no prior navigation.
      const result = await invokeLoader(
        groupingSearch('{"keys":["order_status"]}'),
      );

      expect(result.metaState.groupingKeys).toEqual(['order_status']);
      expect(selectOrdersPage).toHaveBeenCalledWith(
        expect.objectContaining({
          grouping: { aggregates: {}, keys: ['order_status'] },
        }),
      );
    });

    it('degrades a malformed param to grouping off, not to a half-applied query', async () => {
      const result = await invokeLoader(
        groupingSearch('{"keys":["order_status",1]}'),
      );

      expect(result.metaState.groupingKeys).toEqual([]);
      expect(selectOrdersPage).toHaveBeenCalledWith(
        expect.objectContaining({ grouping: NO_GROUPING }),
      );
    });

    it("refuses a key that is not one of this route's columns", async () => {
      const result = await invokeLoader(
        groupingSearch('{"keys":["internal_notes"]}'),
      );

      // A real column of the table, but not one the list view renders — so it
      // is not a key this route can offer, and the whole grouping is dropped.
      expect(result.metaState.groupingKeys).toEqual([]);
    });

    it('refuses the row-actions column as a group key', async () => {
      const { metaState } = await invokeLoader(
        groupingSearch('{"keys":["actions"]}'),
      );

      expect(metaState.groupingKeys).toEqual([]);
    });

    it('returns the same loader fields whether or not the route is grouped', async () => {
      const ungrouped = sortKeys(await invokeLoader());
      const grouped = sortKeys(
        await invokeLoader(groupingSearch('{"keys":["order_status"]}')),
      );

      expect(grouped).toEqual(ungrouped);
      expect(grouped).toEqual(['columnsState', 'dataPromise', 'metaState']);
    });

    it('applies several keys from one shared link, in nesting order', async () => {
      const result = await invokeLoader(
        groupingSearch('{"keys":["order_status","shipping_country"]}'),
      );

      expect(result.metaState.groupingKeys).toEqual([
        'order_status',
        'shipping_country',
      ]);
      expect(selectOrdersPage).toHaveBeenCalledWith(
        expect.objectContaining({
          grouping: {
            aggregates: {},
            keys: ['order_status', 'shipping_country'],
          },
        }),
      );
    });

    it('refuses a key list past the configured depth', async () => {
      // Five real, groupable columns of this route — so the refusal is the cap
      // and nothing else about them.
      const result = await invokeLoader(
        groupingSearch(
          '{"keys":["order_status","shipping_country","priority","carrier","payment_status"]}',
        ),
      );

      expect(result.metaState.groupingKeys).toEqual([]);
    });

    it('applies a selected aggregate from the URL', async () => {
      const result = await invokeLoader(
        groupingSearch(
          '{"agg":{"total_amount":"sum"},"keys":["order_status"]}',
        ),
      );

      expect(result.metaState.groupingAggregates).toEqual({
        total_amount: 'sum',
      });
      expect(selectOrdersPage).toHaveBeenCalledWith(
        expect.objectContaining({
          grouping: {
            aggregates: { total_amount: 'sum' },
            keys: ['order_status'],
          },
        }),
      );
    });

    it('ships the catalogue capabilities so the aggregate menu can be built', async () => {
      const result = await invokeLoader();

      // `total_amount` is a `numeric` this route declares as `dataType:
      // 'currency'`; the menu it drives is the catalogue's answer, not that one.
      expect(
        result.metaState.groupingCapabilities?.total_amount?.aggregates,
      ).toEqual(['avg', 'sum']);
    });
  });
});
