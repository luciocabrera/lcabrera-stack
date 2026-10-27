import { describe, expect, it } from 'vite-plus/test';

import type { ReadScope } from './query-builder.types.ts';

import { resolveColumnReference } from './resolve-column-reference.util.ts';

const SCOPE: ReadScope = {
  base: {
    allowedColumns: ['id', 'amount'],
    qualifier: 'items',
    schema: 'catalog',
    table: 'items',
  },
  from: '"catalog"."items"',
  joins: new Map([
    [
      'vendor',
      {
        allowedColumns: ['id', 'name'],
        qualifier: 'vendor',
        schema: 'catalog',
        table: 'vendors',
      },
    ],
  ]),
};

describe('resolveColumnReference', () => {
  it('quotes a bare column alone on a single-target read', () => {
    expect(
      resolveColumnReference({ allowedColumns: ['id'], reference: 'id' }),
    ).toEqual({ isJoined: false, name: 'id', sql: '"id"' });
  });

  it('qualifies a bare column with the base table once the read joins', () => {
    expect(
      resolveColumnReference({ reference: 'amount', scope: SCOPE }),
    ).toEqual({ isJoined: false, name: 'amount', sql: '"items"."amount"' });
  });

  it('qualifies a joined column with its alias and names it alias.column', () => {
    expect(
      resolveColumnReference({
        reference: { column: 'name', source: 'vendor' },
        scope: SCOPE,
      }),
    ).toEqual({ isJoined: true, name: 'vendor.name', sql: '"vendor"."name"' });
  });

  it('checks a column against its own source list only', () => {
    expect(() =>
      resolveColumnReference({
        reference: { column: 'amount', source: 'vendor' },
        scope: SCOPE,
      }),
    ).toThrow('Column "amount" is not in the allowed list for this query.');
    expect(() =>
      resolveColumnReference({ reference: 'name', scope: SCOPE }),
    ).toThrow('Column "name" is not in the allowed list for this query.');
  });

  it('refuses an unsafe joined column', () => {
    expect(() =>
      resolveColumnReference({
        reference: { column: 'Name', source: 'vendor' },
        scope: SCOPE,
      }),
    ).toThrow('Unsafe identifier: "Name"');
  });

  it('refuses a source the read does not join', () => {
    expect(() =>
      resolveColumnReference({ reference: { column: 'id', source: 'vendor' } }),
    ).toThrow('names the source "vendor", but this read has no join');
    expect(() =>
      resolveColumnReference({
        reference: { column: 'id', source: 'buyer' },
        scope: SCOPE,
      }),
    ).toThrow(`which is not one of this read's joins`);
  });
});
