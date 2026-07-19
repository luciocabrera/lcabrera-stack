import { describe, expect, it } from 'vitest';

import { buildReturningClause } from './buildReturningClause.util.ts';

describe('buildReturningClause', () => {
  it('returns an empty string when returning is omitted', () => {
    expect(buildReturningClause({})).toBe('');
  });

  it('returns an empty string for an empty list', () => {
    expect(buildReturningClause({ returning: [] })).toBe('');
  });

  it('emits RETURNING * for the ["*"] wildcard', () => {
    expect(buildReturningClause({ returning: ['*'] })).toBe('RETURNING *');
  });

  it('quotes an explicit column projection', () => {
    expect(buildReturningClause({ returning: ['widget_id', 'sku'] })).toBe(
      'RETURNING "widget_id", "sku"',
    );
  });

  it('rejects "*" mixed with column names', () => {
    expect(() =>
      buildReturningClause({ returning: ['widget_id', '*'] }),
    ).toThrow();
  });

  it('rejects an unsafe column name', () => {
    expect(() =>
      buildReturningClause({ returning: ['id; DROP TABLE x'] }),
    ).toThrow();
  });

  it('rejects a column not present in an optional allowedColumns list', () => {
    expect(() =>
      buildReturningClause({ allowedColumns: ['sku'], returning: ['secret'] }),
    ).toThrow();
  });
});
