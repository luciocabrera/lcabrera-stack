import type { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
import type { LoaderFunctionArgs } from 'react-router';

import { describe, expect, it, vi } from 'vite-plus/test';

import { loader } from './enterprise-orders.loader';

const { selectGroupedRowsMock, selectRowsMock } = vi.hoisted(() => ({
  selectGroupedRowsMock: vi.fn<
    (descriptor: Parameters<typeof selectGroupedRows>[0]) => Promise<unknown>
  >(async () => ({
    aggregates: [{ alias: 'count_rows', fn: 'count' }],
    groupingSetMasks: [0],
    keys: [],
    maskAlias: 'group_mask',
    rows: [],
  })),
  selectRowsMock: vi.fn(async () => []),
}));

vi.mock('@lcabrera/server/db/get-column-grouping-capabilities.util', () => ({
  getColumnGroupingCapabilities: vi.fn(async () => ({
    total_amount: {
      aggregates: ['avg', 'sum'],
      canGroup: false,
      column: 'total_amount',
      refusal: 'too-many-distinct',
      role: 'fact',
      typeName: 'numeric',
    },
  })),
}));
vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(async () => 0),
}));
vi.mock('@lcabrera/server/db/select-grouped-rows.util', () => ({
  selectGroupedRows: selectGroupedRowsMock,
}));
vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: selectRowsMock,
}));

const groupedRead = () => selectGroupedRowsMock.mock.calls[0]?.[0];

const invokeLoader = async (search = '') =>
  loader({
    request: new Request(`http://localhost/enterprise-orders${search}`),
  } as LoaderFunctionArgs);

const sortKeys = (value: object) =>
  Object.keys(value).toSorted((a, b) => a.localeCompare(b));

const groupingSearch = (param: string) =>
  `?grouping=${encodeURIComponent(param)}`;

describe('enterprise-orders loader', () => {
  it('returns fully serializable columnsState (columns included) and metaState', async () => {
    const result = await invokeLoader();

    expect(structuredClone(result.columnsState)).toStrictEqual(
      result.columnsState,
    );
    expect(structuredClone(result.metaState)).toStrictEqual(result.metaState);
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

  describe('grouping', () => {
    it('takes every request-shaping capability, and the page path, from the source', async () => {
      const { metaState } = await invokeLoader();

      expect(metaState).toEqual(
        expect.objectContaining({
          isGroupingEnabled: true,
          isKeysetEnabled: true,
          isServerFilterEnabled: true,
          pagePath: '/_api/enterprise-orders/paginated',
          schemaName: 'public',
          tableName: 'enterprise_orders',
        }),
      );
    });

    it('applies a group key from the URL, so a shared link restores it', async () => {
      const result = await invokeLoader(
        groupingSearch('{"keys":["order_status"]}'),
      );

      expect(result.groupingState.keys).toEqual(['order_status']);
      expect(groupedRead()).toEqual(
        expect.objectContaining({
          aggregates: [{ fn: 'count' }],
          grouping: 'flat',
          keys: ['order_status'],
          schema: 'public',
          table: 'enterprise_orders',
        }),
      );
    });

    it('degrades a malformed param to grouping off, not to a half-applied query', async () => {
      const result = await invokeLoader(
        groupingSearch('{"keys":["order_status",1]}'),
      );

      expect(result.groupingState.keys).toEqual([]);
      expect(selectGroupedRowsMock).not.toHaveBeenCalled();
      expect(selectRowsMock).toHaveBeenCalledOnce();
    });

    it("refuses a key that is not one of this route's columns", async () => {
      const result = await invokeLoader(
        groupingSearch('{"keys":["internal_notes"]}'),
      );

      expect(result.groupingState.keys).toEqual([]);
    });

    it('refuses the row-actions column as a group key', async () => {
      const { groupingState } = await invokeLoader(
        groupingSearch('{"keys":["actions"]}'),
      );

      expect(groupingState.keys).toEqual([]);
    });

    it('returns the same loader fields whether or not the route is grouped', async () => {
      const ungrouped = sortKeys(await invokeLoader());
      const grouped = sortKeys(
        await invokeLoader(groupingSearch('{"keys":["order_status"]}')),
      );

      expect(grouped).toEqual(ungrouped);
      expect(grouped).toEqual([
        'columnsState',
        'dataPromise',
        'groupingState',
        'metaState',
      ]);
    });

    it('applies several keys from one shared link, in nesting order', async () => {
      const result = await invokeLoader(
        groupingSearch('{"keys":["order_status","shipping_country"]}'),
      );

      expect(result.groupingState.keys).toEqual([
        'order_status',
        'shipping_country',
      ]);
      expect(groupedRead()?.keys).toEqual(['order_status', 'shipping_country']);
    });

    it('refuses a key list past the configured depth', async () => {
      const result = await invokeLoader(
        groupingSearch(
          '{"keys":["order_status","shipping_country","priority","carrier","payment_status"]}',
        ),
      );

      expect(result.groupingState.keys).toEqual([]);
    });

    it('applies a selected aggregate from the URL', async () => {
      const result = await invokeLoader(
        groupingSearch('{"agg":["total_amount:sum"],"keys":["order_status"]}'),
      );

      expect(result.groupingState.aggregates).toEqual([
        { columnKey: 'total_amount', fn: 'sum' },
      ]);
      expect(groupedRead()?.aggregates).toEqual([
        { fn: 'count' },
        { column: 'total_amount', fn: 'sum' },
      ]);
    });

    it('applies two aggregates on one column from the URL', async () => {
      const result = await invokeLoader(
        groupingSearch(
          '{"agg":["total_amount:sum","total_amount:avg"],"keys":["order_status"]}',
        ),
      );

      expect(result.groupingState.aggregates).toEqual([
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'avg' },
      ]);
      expect(groupedRead()?.aggregates).toEqual([
        { fn: 'count' },
        { column: 'total_amount', fn: 'sum' },
        { column: 'total_amount', fn: 'avg' },
      ]);
    });

    it('ships the catalogue capabilities so the aggregate menu can be built', async () => {
      const result = await invokeLoader();

      expect(
        result.metaState.groupingCapabilities?.total_amount?.aggregates,
      ).toEqual(['avg', 'sum']);
    });
  });
});
