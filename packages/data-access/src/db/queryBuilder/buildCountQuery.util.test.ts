import { describe, expect, it } from 'vitest';

import { buildCountQuery } from './buildCountQuery.util.ts';

describe('buildCountQuery', () => {
  it('counts every row with `count(*)` by default', () => {
    const result = buildCountQuery({
      schema: 'cqms',
      table: 'v_scan_findings',
    });

    expect(result).toEqual({
      text: 'SELECT count(*) AS count FROM "cqms"."v_scan_findings"',
      values: [],
    });
  });

  it('counts the given column when `column` is provided', () => {
    const result = buildCountQuery({
      column: 'order_id',
      schema: 'public',
      table: 'enterprise_orders',
    });

    expect(result).toEqual({
      text: 'SELECT count("order_id") AS count FROM "public"."enterprise_orders"',
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
      text: 'SELECT count(*) AS count FROM "cqms"."v_scan_findings" WHERE "severity" = $1',
      values: ['HIGH'],
    });
  });

  it('rejects an unsafe table name', () => {
    expect(() =>
      buildCountQuery({ schema: 'cqms', table: 't; DROP TABLE cqms.users' }),
    ).toThrow();
  });

  it('rejects an unsafe count column', () => {
    expect(() =>
      buildCountQuery({
        column: 'id); DROP TABLE cqms.users --',
        schema: 'cqms',
        table: 'v_scan_findings',
      }),
    ).toThrow();
  });

  it('rejects a count column outside allowedColumns', () => {
    expect(() =>
      buildCountQuery({
        allowedColumns: ['severity'],
        column: 'password_hash',
        schema: 'cqms',
        table: 'v_scan_findings',
      }),
    ).toThrow();
  });
});
