import type { LoaderFunctionArgs } from 'react-router';

import { describe, expect, it, vi } from 'vite-plus/test';

import { loader } from './car-sales.loader';
import { CLIENT_PAGINATION_ROW_LIMIT } from './CarSales.constants';

const { fetchCarSalesPaginatedMock } = vi.hoisted(() => ({
  fetchCarSalesPaginatedMock: vi.fn(() =>
    Promise.resolve({ data: [], hasMore: false, total: 0 }),
  ),
}));

vi.mock('@/services', () => ({
  carSalesApi: {
    fetchCarSalesPaginated: fetchCarSalesPaginatedMock,
  },
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
    request: new Request('http://localhost/car-sales'),
  } as LoaderFunctionArgs);

describe('car-sales loader', () => {
  it('returns fully serializable columnsState (columns included) and metaState', () => {
    const result = invokeLoader();

    expect(collectFunctionPaths({ value: result.columnsState })).toEqual([]);
    expect(collectFunctionPaths({ value: result.metaState })).toEqual([]);
  });

  it('bakes distinct descriptors with the loader transport onto string columns', () => {
    const { columns } = invokeLoader().columnsState;

    const model = columns.find((column) => column.key === 'model');
    expect(model?.filterOptionsDescriptor).toEqual({
      kind: 'distinct',
      params: {
        columnName: 'model',
        schemaName: 'public',
        tableName: 'car_sales',
      },
      transport: 'loader',
    });

    const year = columns.find((column) => column.key === 'year');
    expect(year?.filterOptionsDescriptor).toBeUndefined();
  });

  it('requests a bounded slice rather than the whole table', () => {
    // car_sales holds 500k rows. Fetching it unbounded produced a ~421MB body
    // and killed SSR with a V8 zone allocation failure, so this route must
    // always ask for a limit.
    fetchCarSalesPaginatedMock.mockClear();

    invokeLoader();

    expect(fetchCarSalesPaginatedMock).toHaveBeenCalledTimes(1);
    expect(fetchCarSalesPaginatedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: CLIENT_PAGINATION_ROW_LIMIT,
        skip: 0,
      }),
    );
  });
});
