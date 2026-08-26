import type { LoaderFunctionArgs } from 'react-router';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { loader } from './filter-options.loader';

const { selectDistinctFilterOptionsMock } = vi.hoisted(() => ({
  selectDistinctFilterOptionsMock: vi.fn(),
}));

// Only the DB-touching service is mocked; parseFilterOptionsParams stays real so
// the loader's validation path is exercised, not stubbed.
vi.mock('./.server/distinct.service', () => ({
  selectDistinctFilterOptions: selectDistinctFilterOptionsMock,
}));

const invokeLoader = (search: string) => {
  const request = new Request(`http://localhost/_api/filter-options?${search}`);

  return loader({ request } as LoaderFunctionArgs);
};

describe('filter-options loader', () => {
  beforeEach(() => {
    selectDistinctFilterOptionsMock.mockReset();
    selectDistinctFilterOptionsMock.mockResolvedValue({
      hasMore: true,
      values: ['Blue'],
    });
  });

  it('reads distinct values server-side from the validated params and returns JSON', async () => {
    const response = await invokeLoader(
      'schemaName=public&tableName=car_sales&columnName=color&limit=50&offset=100',
    );

    expect(selectDistinctFilterOptionsMock).toHaveBeenCalledWith({
      columnName: 'color',
      limit: 50,
      offset: 100,
      schemaName: 'public',
      tableName: 'car_sales',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hasMore: true, values: ['Blue'] });
  });

  it('answers 400 without querying when source params are missing', async () => {
    const response = await invokeLoader('columnName=color');

    expect(selectDistinctFilterOptionsMock).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Missing schemaName, tableName, or columnName',
    });
  });

  it('answers 400 when the source or column is not allow-listed', async () => {
    selectDistinctFilterOptionsMock.mockResolvedValue(undefined);

    const response = await invokeLoader(
      'schemaName=public&tableName=secrets&columnName=password&limit=50&offset=0',
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Unsupported distinct source or column',
    });
  });
});
