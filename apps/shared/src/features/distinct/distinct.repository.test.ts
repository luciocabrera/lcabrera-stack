import { describe, expect, it, vi } from 'vitest';

import type { Queryable } from '../../types/api.types.js';

import { HttpError } from '../../errors/httpError.js';
import { createDistinctRepository } from './distinct.repository.js';

const createPoolMock = (rows: readonly { readonly value: string }[]) => {
  const query = vi.fn().mockResolvedValue({ rowCount: rows.length, rows });
  return { pool: { query } as unknown as Queryable, query };
};

describe('createDistinctRepository', () => {
  it('runs an allow-listed parameterized SELECT DISTINCT and maps rows to values', async () => {
    const { pool, query } = createPoolMock([
      { value: 'Delivered' },
      { value: 'Pending' },
    ]);
    const repository = createDistinctRepository({ pool });

    const result = await repository.getDistinctValues({
      columnName: 'order_status',
      limit: 2,
      offset: 4,
      schemaName: 'public',
      tableName: 'enterprise_orders',
    });

    expect(query).toHaveBeenCalledWith(
      'SELECT DISTINCT "order_status" AS value FROM "public"."enterprise_orders" WHERE "order_status" IS NOT NULL AND "order_status"::text != \'\' ORDER BY "order_status" LIMIT $1 OFFSET $2',
      [2, 4],
    );
    expect(result).toEqual({
      hasMore: true,
      values: ['Delivered', 'Pending'],
    });
  });

  it('reports hasMore false when the page is short', async () => {
    const { pool } = createPoolMock([{ value: 'Blue' }]);
    const repository = createDistinctRepository({ pool });

    const result = await repository.getDistinctValues({
      columnName: 'color',
      limit: 50,
      offset: 0,
      schemaName: 'public',
      tableName: 'car_sales',
    });

    expect(result).toEqual({ hasMore: false, values: ['Blue'] });
  });

  it('rejects a source outside the allow-list before touching the pool', async () => {
    const { pool, query } = createPoolMock([]);
    const repository = createDistinctRepository({ pool });

    await expect(
      repository.getDistinctValues({
        columnName: 'password',
        limit: 50,
        offset: 0,
        schemaName: 'public',
        tableName: 'users',
      }),
    ).rejects.toThrow(HttpError);
    expect(query).not.toHaveBeenCalled();
  });
});
