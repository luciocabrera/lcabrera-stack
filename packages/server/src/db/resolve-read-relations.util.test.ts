import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getPool } from './get-pool.util.ts';
import { resolveReadRelations } from './resolve-read-relations.util.ts';

vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

const JOIN = {
  alias: 'vendor',
  allowedColumns: ['name'],
  foreignKey: ['vendor_id'],
  kind: 'inner',
} as const;

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue({ rows: [] });
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('resolveReadRelations', () => {
  it('asks the catalogue nothing for a read without a join', async () => {
    await expect(
      resolveReadRelations({ schema: 'catalog', table: 'items' }),
    ).resolves.toBeUndefined();
    expect(query).not.toHaveBeenCalled();
  });

  it('keeps a relation map the caller already resolved', async () => {
    const relations = [
      {
        columns: ['vendor_id'],
        referencedColumns: ['id'],
        referencedSchema: 'catalog',
        referencedTable: 'vendors',
        schema: 'catalog',
        table: 'items',
      },
    ];

    await expect(
      resolveReadRelations({
        joins: [JOIN],
        relations,
        schema: 'catalog',
        table: 'items',
      }),
    ).resolves.toBe(relations);
    expect(query).not.toHaveBeenCalled();
  });

  it('reads the map as deep as the join chain', async () => {
    await resolveReadRelations({
      joins: [JOIN, { ...JOIN, alias: 'country', source: 'vendor' }],
      schema: 'catalog',
      table: 'items',
    });

    expect(query.mock.calls[0]?.[1]).toEqual(['catalog', 'items', 2]);
  });
});
