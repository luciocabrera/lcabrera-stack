import { describe, expect, it } from 'vitest';

import { buildDeleteQuery } from './build-delete-query.util.ts';

describe('buildDeleteQuery', () => {
  it('builds a filtered DELETE with parameterized values', () => {
    const result = buildDeleteQuery({
      filters: [{ column: 'widget_id', operator: 'eq', value: 7 }],
      schema: 'inventory',
      table: 'widgets',
    });

    expect(result).toEqual({
      text: 'DELETE FROM "inventory"."widgets" WHERE "widget_id" = $1',
      values: [7],
    });
  });

  it('appends RETURNING * so the deleted row(s) can come back', () => {
    const result = buildDeleteQuery({
      filters: [{ column: 'widget_id', operator: 'eq', value: 7 }],
      returning: ['*'],
      schema: 'inventory',
      table: 'widgets',
    });

    expect(result.text).toBe(
      'DELETE FROM "inventory"."widgets" WHERE "widget_id" = $1 RETURNING *',
    );
  });

  it('refuses to build an unfiltered DELETE', () => {
    expect(() =>
      buildDeleteQuery({ filters: [], schema: 'inventory', table: 'widgets' }),
    ).toThrow();
  });

  it('rejects an unsafe table name', () => {
    expect(() =>
      buildDeleteQuery({
        filters: [{ column: 'widget_id', operator: 'eq', value: 1 }],
        schema: 'inventory',
        table: 'widgets; DROP TABLE users',
      }),
    ).toThrow();
  });

  it('rejects a filter column not present in an optional allowedColumns list', () => {
    expect(() =>
      buildDeleteQuery({
        allowedColumns: ['widget_id'],
        filters: [{ column: 'secret', operator: 'eq', value: 1 }],
        schema: 'inventory',
        table: 'widgets',
      }),
    ).toThrow();
  });
});
