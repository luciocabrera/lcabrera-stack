import type { LoaderFunctionArgs } from 'react-router';

import { describe, expect, it, vi } from 'vitest';

import { loader } from './car-sales.loader';

vi.mock('@/services', () => ({
  carSalesApi: {
    fetchCarSales: vi.fn(() => Promise.resolve({ data: [], total: 0 })),
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
});
