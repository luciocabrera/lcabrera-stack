import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

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
    // Allow-list is the source's full column set, not just the one requested.
    const [descriptor] = selectFilterOptionsMock.mock.calls[0] ?? [];
    expect(descriptor.allowedColumns).toContain('color');
    expect(descriptor.allowedColumns).toContain('buyer_name');
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
