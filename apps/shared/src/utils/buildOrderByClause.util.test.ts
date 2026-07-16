import { describe, expect, it } from 'vitest';

import { HttpError } from '../errors/httpError.js';
import { buildOrderByClause } from './buildOrderByClause.util.js';

describe('buildOrderByClause', () => {
  it('uses the explicit sorting when it is present', () => {
    expect(
      buildOrderByClause({
        fallbackSorting: [{ columnKey: 'id', direction: 'asc' }],
        sorting: [
          { columnKey: 'created_at', direction: 'desc' },
          { columnKey: 'id', direction: 'asc' },
        ],
      }),
    ).toBe('ORDER BY created_at DESC, id ASC');
  });

  it('falls back to the default sorting when the active sorting is empty', () => {
    expect(
      buildOrderByClause({
        fallbackSorting: [{ columnKey: 'id', direction: 'asc' }],
        sorting: [],
      }),
    ).toBe('ORDER BY id ASC');
  });

  it('throws when both sorting inputs are empty', () => {
    expect(() =>
      buildOrderByClause({
        fallbackSorting: [],
        sorting: [],
      }),
    ).toThrow(HttpError);
  });
});
