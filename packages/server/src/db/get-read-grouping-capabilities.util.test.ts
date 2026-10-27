import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { ReadScope } from './query-builder/query-builder.types.ts';

import { getPool } from './get-pool.util.ts';
import { getReadGroupingCapabilities } from './get-read-grouping-capabilities.util.ts';

vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

const capabilityRow = (column: string) => ({
  aggregates: ['count', 'max', 'min'],
  column,
  hasEquality: true,
  hasStats: true,
  nDistinct: 12,
  relTuples: 10_000,
  typeCategory: 'S',
  typeName: 'text',
});

const SCOPE: ReadScope = {
  base: {
    allowedColumns: ['status'],
    qualifier: 'items',
    schema: 'catalog',
    table: 'items',
  },
  from: '"catalog"."items"',
  joins: new Map([
    [
      'country',
      {
        allowedColumns: ['name'],
        qualifier: 'country',
        schema: 'ref',
        table: 'countries',
      },
    ],
    [
      'vendor',
      {
        allowedColumns: ['status'],
        qualifier: 'vendor',
        schema: 'catalog',
        table: 'vendors',
      },
    ],
  ]),
};

beforeEach(() => {
  query.mockReset();
  query.mockImplementation(
    async (...call: readonly [string, readonly unknown[]]) => ({
      rows: (call[1][2] as readonly string[]).map((column) =>
        capabilityRow(column),
      ),
    }),
  );
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('getReadGroupingCapabilities', () => {
  it('resolves each source against its own table and keys a joined entry by alias.column', async () => {
    const capabilities = await getReadGroupingCapabilities({
      references: ['status', { column: 'status', source: 'vendor' }],
      schema: 'catalog',
      scope: SCOPE,
      table: 'items',
    });

    expect(
      Object.keys(capabilities).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual(['status', 'vendor.status']);
    expect(query.mock.calls.map(([, values]) => values.slice(0, 3))).toEqual([
      ['catalog', 'items', ['status']],
      ['catalog', 'vendors', ['status']],
    ]);
  });

  it('asks nothing of a joined source the read never names', async () => {
    await getReadGroupingCapabilities({
      references: ['status'],
      schema: 'catalog',
      scope: SCOPE,
      table: 'items',
    });

    expect(query).toHaveBeenCalledTimes(1);
  });
});
