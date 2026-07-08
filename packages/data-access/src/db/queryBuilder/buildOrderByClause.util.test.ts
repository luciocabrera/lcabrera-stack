import { describe, expect, it } from 'vitest';

import { buildOrderByClause } from './buildOrderByClause.util.ts';

describe('buildOrderByClause', () => {
  it('returns an empty string when there is no sort', () => {
    expect(buildOrderByClause({ sort: [] })).toBe('');
  });

  it('returns an empty string when sort is omitted', () => {
    expect(buildOrderByClause({})).toBe('');
  });

  it('builds a single-column ascending clause', () => {
    expect(
      buildOrderByClause({
        sort: [{ column: 'usage_date', direction: 'asc' }],
      }),
    ).toBe('ORDER BY "usage_date" ASC');
  });

  it('builds a multi-column clause preserving order', () => {
    expect(
      buildOrderByClause({
        sort: [
          { column: 'total_cost_usd', direction: 'desc' },
          { column: 'scanner_id', direction: 'asc' },
        ],
      }),
    ).toBe('ORDER BY "total_cost_usd" DESC, "scanner_id" ASC');
  });

  it('rejects an unsafe column name', () => {
    expect(() =>
      buildOrderByClause({
        sort: [{ column: 'x; DROP TABLE y', direction: 'asc' }],
      }),
    ).toThrow();
  });

  it('rejects a column not present in an optional allowedColumns list', () => {
    expect(() =>
      buildOrderByClause({
        allowedColumns: ['total_cost_usd'],
        sort: [{ column: 'password_hash', direction: 'asc' }],
      }),
    ).toThrow();
  });
});
