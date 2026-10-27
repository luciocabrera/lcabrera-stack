import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TransactionClient } from './db.types.ts';

import { PersistenceError } from '../errors/persistence.error.ts';
import { getPool } from './get-pool.util.ts';
import { selectRows } from './select-rows.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('selectRows', () => {
  it('executes the descriptor as SQL on the pool and returns the driver rows', async () => {
    const rows = [{ id: 'a' }, { id: 'b' }];
    query.mockResolvedValue({ rows });

    const result = await selectRows<{ readonly id: string }>({
      fields: ['id'],
      schema: 'reporting',
      sort: [{ column: 'id', direction: 'asc' }],
      table: 'v_daily_totals',
    });

    expect(result).toEqual(rows);
    expect(query).toHaveBeenCalledWith(
      'SELECT "id" FROM "reporting"."v_daily_totals" ORDER BY "id" ASC',
      [],
    );
  });

  it('forwards filter values as bound parameters rather than inlining them', async () => {
    query.mockResolvedValue({ rows: [] });

    await selectRows({
      fields: ['id'],
      filters: [{ column: 'order_id', operator: 'eq', value: 'abc' }],
      schema: 'reporting',
      table: 'v_daily_totals',
    });

    expect(query).toHaveBeenCalledWith(
      'SELECT "id" FROM "reporting"."v_daily_totals" WHERE "order_id" = $1',
      ['abc'],
    );
  });

  it('propagates the builder rejection without touching the pool', async () => {
    await expect(
      selectRows({
        fields: ['id'],
        schema: 'reporting',
        table: 'v; DROP TABLE',
      }),
    ).rejects.toThrow('Unsafe identifier: "v; DROP TABLE"');

    expect(query).not.toHaveBeenCalled();
  });

  it('reads on the transaction client when tx is passed, so it sees uncommitted writes', async () => {
    const txQuery = vi.fn().mockResolvedValue({ rows: [] });

    await selectRows({
      fields: ['id'],
      schema: 'reporting',
      table: 'v_daily_totals',
      tx: { query: txQuery } as unknown as TransactionClient,
    });

    expect(txQuery).toHaveBeenCalledWith(
      'SELECT "id" FROM "reporting"."v_daily_totals"',
      [],
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('translates a driver rejection, so a read cannot leak schema detail either', async () => {
    query.mockRejectedValue(
      Object.assign(new Error('column "secret_internal_col" does not exist'), {
        code: '42703',
      }),
    );

    const selecting = selectRows({
      fields: ['id'],
      schema: 'reporting',
      table: 'v_daily_totals',
    });

    await expect(selecting).rejects.toThrow(PersistenceError);
    await expect(selecting).rejects.toThrow(
      'The database rejected the operation.',
    );
  });

  it('builds a plain select when the descriptor also carries a count or grouping field', async () => {
    query.mockResolvedValue({ rows: [] });
    const descriptor = {
      count: true,
      fields: ['id'],
      grouping: 'rollup',
      schema: 'catalog',
      table: 'items',
    } as const;

    await selectRows(descriptor);

    expect(query).toHaveBeenCalledWith(
      'SELECT "id" FROM "catalog"."items"',
      [],
    );
  });

  it('resolves the relation map before a read with a join, then joins along it', async () => {
    query
      .mockResolvedValueOnce({
        rows: [
          {
            columns: ['vendor_id'],
            referencedColumns: ['id'],
            referencedSchema: 'catalog',
            referencedTable: 'vendors',
            schema: 'catalog',
            table: 'items',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });

    await selectRows({
      allowedColumns: ['id', 'vendor_id'],
      fields: ['id', { column: 'name', source: 'vendor' }],
      joins: [
        {
          alias: 'vendor',
          allowedColumns: ['name'],
          foreignKey: ['vendor_id'],
          kind: 'left',
        },
      ],
      schema: 'catalog',
      table: 'items',
    });

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0]?.[1]).toEqual(['catalog', 'items', 1]);
    expect(query).toHaveBeenLastCalledWith(
      'SELECT "items"."id", "vendor"."name" AS "vendor.name" FROM "catalog"."items" ' +
        'LEFT JOIN "catalog"."vendors" AS "vendor" ON "items"."vendor_id" = "vendor"."id"',
      [],
    );
  });
});
