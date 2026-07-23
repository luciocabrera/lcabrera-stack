import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getPool } from './get-pool.util.ts';
import { selectFilterOptions } from './select-filter-options.util.ts';

vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('selectFilterOptions', () => {
  it('excludes NULL and empty for a text column, ordered + paginated, mapped to values', async () => {
    query.mockResolvedValue({ rows: [{ color: 'Blue' }, { color: 'Red' }] });

    const page = await selectFilterOptions({
      allowedColumns: ['color'],
      column: 'color',
      columnType: 'text',
      limit: 50,
      offset: 100,
      schema: 'public',
      table: 'car_sales',
    });

    expect(page).toEqual({ hasMore: false, values: ['Blue', 'Red'] });
    expect(query).toHaveBeenCalledWith(
      'SELECT DISTINCT "color" FROM "public"."car_sales" ' +
        'WHERE "color" IS NOT NULL AND "color" <> $1 ORDER BY "color" ASC LIMIT $2 OFFSET $3',
      ['', 50, 100],
    );
  });

  it('omits the empty-string check for a non-text column', async () => {
    query.mockResolvedValue({ rows: [{ year: '2020' }] });

    const page = await selectFilterOptions({
      column: 'year',
      columnType: 'number',
      limit: 50,
      offset: 0,
      schema: 'public',
      table: 'car_sales',
    });

    expect(page).toEqual({ hasMore: false, values: ['2020'] });
    expect(query).toHaveBeenCalledWith(
      'SELECT DISTINCT "year" FROM "public"."car_sales" ' +
        'WHERE "year" IS NOT NULL ORDER BY "year" ASC LIMIT $1 OFFSET $2',
      [50, 0],
    );
  });

  it('reports hasMore when the page fills to the limit', async () => {
    query.mockResolvedValue({ rows: [{ color: 'Blue' }, { color: 'Red' }] });

    const page = await selectFilterOptions({
      column: 'color',
      columnType: 'text',
      limit: 2,
      offset: 0,
      schema: 'public',
      table: 'car_sales',
    });

    expect(page.hasMore).toBe(true);
  });
});
