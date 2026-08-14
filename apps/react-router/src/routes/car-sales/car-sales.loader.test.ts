import type { LoaderFunctionArgs } from 'react-router';

import { describe, expect, it, vi } from 'vite-plus/test';

import { loader } from './car-sales.loader';
import { CLIENT_PAGINATION_ROW_LIMIT } from './CarSales.constants';

const { readCarSalesPageMock } = vi.hoisted(() => ({
  readCarSalesPageMock: vi.fn(() =>
    Promise.resolve({ data: [], hasMore: false, total: 0 }),
  ),
}));

vi.mock('./.server/carSales.service', () => ({
  readCarSalesPage: readCarSalesPageMock,
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

const invokeLoader = async () =>
  loader({
    request: new Request('http://localhost/car-sales'),
  } as LoaderFunctionArgs);

describe('car-sales loader', () => {
  it('returns fully serializable columnsState (columns included) and metaState', async () => {
    const result = await invokeLoader();

    expect(collectFunctionPaths({ value: result.columnsState })).toEqual([]);
    expect(collectFunctionPaths({ value: result.metaState })).toEqual([]);
  });

  it('bakes distinct descriptors with the loader transport onto string columns', async () => {
    const { columnsState } = await invokeLoader();
    const { columns } = columnsState;

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

  it('requests a bounded slice rather than the whole table', async () => {
    // car_sales holds 500k rows. Reading it unbounded produced a ~421MB body
    // and killed SSR with a V8 zone allocation failure, so this route must
    // always ask for a limit.
    readCarSalesPageMock.mockClear();

    await invokeLoader();

    expect(readCarSalesPageMock).toHaveBeenCalledTimes(1);
    expect(readCarSalesPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: CLIENT_PAGINATION_ROW_LIMIT,
        skip: 0,
      }),
    );
  });

  it("reads through the route's own server service, not an api-server URL", async () => {
    // The route renders with no API server running, so its first page must come
    // from the service that reads Postgres in this process. `readCarSalesPage`
    // owns the external-override branch behind that call.
    readCarSalesPageMock.mockClear();

    await invokeLoader();

    expect(readCarSalesPageMock).toHaveBeenCalledTimes(1);
  });

  it('carries the primary-key tiebreaker into the sort it asks for', async () => {
    // `createTableRouteLoader` appends it (ADR-008); without it a page boundary
    // inside a tie group repeats and skips rows.
    readCarSalesPageMock.mockClear();

    await invokeLoader();

    expect(readCarSalesPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sorting: [{ columnKey: 'car_id', direction: 'asc' }],
      }),
    );
  });
});
