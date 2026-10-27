import { describe, expect, it } from 'vite-plus/test';

import type { ReadScope } from '../query-builder/query-builder.types.ts';

import { resolveGroupKeyColumns } from './resolve-group-key-columns.util.ts';

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
      'vendor',
      {
        allowedColumns: ['opened_on'],
        qualifier: 'vendor',
        schema: 'catalog',
        table: 'vendors',
      },
    ],
  ]),
};

describe('resolveGroupKeyColumns', () => {
  it('leaves a single-target key bare', () => {
    expect(
      resolveGroupKeyColumns({
        allowedColumns: ['status'],
        capabilities: {},
        keys: ['status'],
      }),
    ).toEqual([
      { expression: '"status"', name: 'status', projection: '"status"' },
    ]);
  });

  it('qualifies every key over a join and aliases a joined one', () => {
    expect(
      resolveGroupKeyColumns({
        allowedColumns: ['status'],
        capabilities: {},
        keys: ['status', { column: 'opened_on', source: 'vendor' }],
        scope: SCOPE,
      }),
    ).toEqual([
      {
        expression: '"items"."status"',
        name: 'status',
        projection: '"items"."status"',
      },
      {
        expression: '"vendor"."opened_on"',
        name: 'vendor.opened_on',
        projection: '"vendor"."opened_on" AS "vendor.opened_on"',
      },
    ]);
  });

  it('truncates a joined key by the period keyed by its projected name', () => {
    const [column] = resolveGroupKeyColumns({
      allowedColumns: ['status'],
      capabilities: {},
      keys: [{ column: 'opened_on', source: 'vendor' }],
      periods: { 'vendor.opened_on': 'month' },
      scope: SCOPE,
    });

    expect(column?.projection).toBe(
      `date_trunc('month', "vendor"."opened_on"::timestamp) AS "vendor.opened_on"`,
    );
  });
});
