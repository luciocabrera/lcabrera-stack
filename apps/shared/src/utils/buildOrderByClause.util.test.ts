import { describe, expect, it } from 'vite-plus/test';

import { HttpError } from '../errors/httpError.js';
import { buildOrderByClause } from './buildOrderByClause.util.js';

const ALLOWED = new Set(['created_at', 'id']);

describe('buildOrderByClause', () => {
  it('uses the explicit sorting when it is present', () => {
    expect(
      buildOrderByClause({
        allowedColumns: ALLOWED,
        fallbackSorting: [{ columnKey: 'id', direction: 'asc' }],
        sorting: [
          { columnKey: 'created_at', direction: 'desc' },
          { columnKey: 'id', direction: 'asc' },
        ],
      }),
    ).toBe('ORDER BY "created_at" DESC, "id" ASC');
  });

  it('falls back to the default sorting when the active sorting is empty', () => {
    expect(
      buildOrderByClause({
        allowedColumns: ALLOWED,
        fallbackSorting: [{ columnKey: 'id', direction: 'asc' }],
        sorting: [],
      }),
    ).toBe('ORDER BY "id" ASC');
  });

  it('throws when both sorting inputs are empty', () => {
    expect(() =>
      buildOrderByClause({
        allowedColumns: ALLOWED,
        fallbackSorting: [],
        sorting: [],
      }),
    ).toThrow(HttpError);
  });

  // The reason this adapter delegates instead of building the clause itself:
  // the previous implementation interpolated `columnKey` straight into SQL,
  // so neither of the next two cases was caught here.
  it('rejects a column that is not in the allow-list', () => {
    expect(() =>
      buildOrderByClause({
        allowedColumns: ALLOWED,
        fallbackSorting: [{ columnKey: 'id', direction: 'asc' }],
        sorting: [{ columnKey: 'internal_notes', direction: 'asc' }],
      }),
    ).toThrow(/not in the allowed list/);
  });

  it('rejects a malformed identifier before it reaches the allow-list check', () => {
    expect(() =>
      buildOrderByClause({
        allowedColumns: ALLOWED,
        fallbackSorting: [{ columnKey: 'id', direction: 'asc' }],
        sorting: [{ columnKey: 'id; DROP TABLE users --', direction: 'asc' }],
      }),
    ).toThrow(/Unsafe identifier/);
  });

  it('quotes identifiers so a column never lands in the clause bare', () => {
    expect(
      buildOrderByClause({
        allowedColumns: ALLOWED,
        fallbackSorting: [],
        sorting: [{ columnKey: 'id', direction: 'asc' }],
      }),
    ).toBe('ORDER BY "id" ASC');
  });
});
