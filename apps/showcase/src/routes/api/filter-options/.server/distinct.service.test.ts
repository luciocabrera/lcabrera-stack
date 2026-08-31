import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { MAX_FILTER_OPTIONS_LIMIT } from '@/routes/api/filter-options/filter-options.constants';

import { selectDistinctFilterOptions } from './distinct.service';

const { selectFilterOptionsMock } = vi.hoisted(() => ({
  selectFilterOptionsMock: vi.fn(),
}));

// The package helper is the DB edge; mocking it keeps this suite DB-free and
// asserts only the app's job: resolve the source/column from config and
// delegate with the right args (allow-list + column type).
vi.mock('@lcabrera/server/db/select-filter-options.util', () => ({
  selectFilterOptions: selectFilterOptionsMock,
}));

describe('selectDistinctFilterOptions', () => {
  beforeEach(() => {
    selectFilterOptionsMock.mockReset();
    selectFilterOptionsMock.mockResolvedValue({
      hasMore: false,
      values: ['Blue'],
    });
  });

  it('delegates an allow-listed column with its config column type and allow-list', async () => {
    const page = await selectDistinctFilterOptions({
      columnName: 'color',
      limit: 50,
      offset: 100,
      schemaName: 'public',
      tableName: 'car_sales',
    });

    expect(page).toEqual({ hasMore: false, values: ['Blue'] });
    expect(selectFilterOptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        column: 'color',
        columnType: 'text',
        limit: 50,
        offset: 100,
        schema: 'public',
        table: 'car_sales',
      }),
    );
    const [descriptor] = selectFilterOptionsMock.mock.calls[0] ?? [];
    expect(descriptor.allowedColumns).toContain('color');
    expect(descriptor.allowedColumns).toContain('buyer_name');
  });

  it('clamps a limit above the ceiling to exactly the ceiling', async () => {
    await selectDistinctFilterOptions({
      columnName: 'color',
      limit: MAX_FILTER_OPTIONS_LIMIT + 1_000_000,
      offset: 0,
      schemaName: 'public',
      tableName: 'car_sales',
    });

    expect(selectFilterOptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: MAX_FILTER_OPTIONS_LIMIT }),
    );
  });

  it('serves a limit exactly at the ceiling', async () => {
    await selectDistinctFilterOptions({
      columnName: 'color',
      limit: MAX_FILTER_OPTIONS_LIMIT,
      offset: 0,
      schemaName: 'public',
      tableName: 'car_sales',
    });

    expect(selectFilterOptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: MAX_FILTER_OPTIONS_LIMIT }),
    );
  });

  it('floors a zero limit to 1 rather than serving a page that claims more', async () => {
    await selectDistinctFilterOptions({
      columnName: 'color',
      limit: 0,
      offset: 0,
      schemaName: 'public',
      tableName: 'car_sales',
    });

    expect(selectFilterOptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 1 }),
    );
  });

  it('leaves an ordinary limit and offset untouched', async () => {
    await selectDistinctFilterOptions({
      columnName: 'color',
      limit: 25,
      offset: 75,
      schemaName: 'public',
      tableName: 'car_sales',
    });

    expect(selectFilterOptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25, offset: 75 }),
    );
  });

  it('returns undefined for a source outside the allow-list, without delegating', async () => {
    const page = await selectDistinctFilterOptions({
      columnName: 'color',
      limit: 50,
      offset: 0,
      schemaName: 'public',
      tableName: 'secrets',
    });

    expect(page).toBeUndefined();
    expect(selectFilterOptionsMock).not.toHaveBeenCalled();
  });

  it('returns undefined for a column not allow-listed for its source, without delegating', async () => {
    const page = await selectDistinctFilterOptions({
      columnName: 'internal_notes',
      limit: 50,
      offset: 0,
      schemaName: 'public',
      tableName: 'enterprise_orders',
    });

    expect(page).toBeUndefined();
    expect(selectFilterOptionsMock).not.toHaveBeenCalled();
  });
});
