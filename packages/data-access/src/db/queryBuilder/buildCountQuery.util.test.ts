import { describe, expect, it } from 'vitest';

import { buildCountQuery } from './buildCountQuery.util.ts';

describe('buildCountQuery', () => {
  it('builds a bare count query with no filters', () => {
    const result = buildCountQuery({
      schema: 'cqms',
      table: 'v_scan_findings',
    });

    expect(result).toEqual({
      text: 'SELECT count(id) AS count FROM "cqms"."v_scan_findings"',
      values: [],
    });
  });

  it('applies the same WHERE clause a matching buildSelectQuery call would produce', () => {
    const result = buildCountQuery({
      filters: [{ column: 'severity', operator: 'eq', value: 'HIGH' }],
      schema: 'cqms',
      table: 'v_scan_findings',
    });

    expect(result).toEqual({
      text: 'SELECT count(id) AS count FROM "cqms"."v_scan_findings" WHERE "severity" = $1',
      values: ['HIGH'],
    });
  });

  it('rejects an unsafe table name', () => {
    expect(() =>
      buildCountQuery({ schema: 'cqms', table: 't; DROP TABLE cqms.users' }),
    ).toThrow();
  });
});
