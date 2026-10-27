import { describe, expect, it } from 'vite-plus/test';

import { buildJoinClause } from './build-join-clause.util.ts';

describe('buildJoinClause', () => {
  it('writes one equality per column pair, in constraint order', () => {
    expect(
      buildJoinClause({
        alias: 'region',
        kind: 'left',
        relation: {
          columns: ['region_code', 'region_year'],
          referencedColumns: ['code', 'year'],
          referencedSchema: 'ref',
          referencedTable: 'regions',
          schema: 'catalog',
          table: 'items',
        },
        sourceQualifier: 'items',
      }),
    ).toBe(
      'LEFT JOIN "ref"."regions" AS "region" ON "items"."region_code" = "region"."code" AND "items"."region_year" = "region"."year"',
    );
  });

  it('writes an inner join', () => {
    expect(
      buildJoinClause({
        alias: 'vendor',
        kind: 'inner',
        relation: {
          columns: ['vendor_id'],
          referencedColumns: ['id'],
          referencedSchema: 'catalog',
          referencedTable: 'vendors',
          schema: 'catalog',
          table: 'items',
        },
        sourceQualifier: 'items',
      }),
    ).toMatch(/^INNER JOIN "catalog"\."vendors" AS "vendor" ON /u);
  });
});
