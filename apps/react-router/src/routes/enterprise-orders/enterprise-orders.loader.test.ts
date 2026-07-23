import type { LoaderFunctionArgs } from 'react-router';

import { describe, expect, it, vi } from 'vitest';

import { loader } from './enterprise-orders.loader';

vi.mock('./.server/enterpriseOrders.service', () => ({
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

const invokeLoader = () =>
  loader({
    request: new Request('http://localhost/enterprise-orders'),
  } as LoaderFunctionArgs);

describe('enterprise-orders loader', () => {
  // Single-fetch serialization silently replaces functions with undefined on
  // the client (SingleFetchFallback), so everything the loader returns —
  // including the descriptor-bearing columns — must be function-free.
  it('returns fully serializable columnsState (columns included) and metaState', () => {
    const result = invokeLoader();

    expect(collectFunctionPaths({ value: result.columnsState })).toEqual([]);
    expect(collectFunctionPaths({ value: result.metaState })).toEqual([]);
  });

  it('bakes distinct descriptors with loader transport onto filterable string columns', () => {
    const { columns } = invokeLoader().columnsState;

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

  it('keeps static descriptors on enum columns and none on non-string columns', () => {
    const { columns } = invokeLoader().columnsState;

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
});
