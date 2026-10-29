import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { PersistenceError } from '../errors/persistence.error.ts';
import { getForeignKeyRelations } from './get-foreign-key-relations.util.ts';
import { getPool } from './get-pool.util.ts';

vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

const RELATION = {
  columns: ['vendor_id'],
  referencedColumns: ['id'],
  referencedSchema: 'catalog',
  referencedTable: 'vendors',
  schema: 'catalog',
  table: 'items',
};

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('getForeignKeyRelations', () => {
  it('reads the relation map in one catalogue round trip', async () => {
    query.mockResolvedValue({ rows: [RELATION] });

    const relations = await getForeignKeyRelations({
      depth: 2,
      schema: 'catalog',
      table: 'items',
    });

    expect(relations).toEqual([RELATION]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[1]).toEqual(['catalog', 'items', 2]);
  });

  it('translates a driver failure', async () => {
    query.mockRejectedValue(new Error('connection reset'));

    await expect(
      getForeignKeyRelations({ depth: 1, schema: 'catalog', table: 'items' }),
    ).rejects.toThrow(PersistenceError);
  });
});
