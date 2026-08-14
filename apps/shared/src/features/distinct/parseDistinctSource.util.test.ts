import { describe, expect, it } from 'vite-plus/test';

import { HttpError } from '../../errors/httpError.js';
import { parseDistinctSource } from './parseDistinctSource.util.js';

describe('parseDistinctSource', () => {
  it('returns the validated source with its allowed columns', () => {
    const result = parseDistinctSource({
      columnName: 'customer_email',
      schemaName: 'public',
      tableName: 'enterprise_orders',
    });

    expect(result.columnName).toBe('customer_email');
    expect(result.schemaName).toBe('public');
    expect(result.tableName).toBe('enterprise_orders');
    expect(result.allowedColumns).toContain('customer_email');
    // Carried from the registry rather than assumed: the column type is what
    // decides whether the read drops the empty string.
    expect(result.columnType).toBe('text');
  });

  it('throws a 400 HttpError for an unknown schema/table source', () => {
    expect(() =>
      parseDistinctSource({
        columnName: 'customer_email',
        schemaName: 'public',
        tableName: 'users',
      }),
    ).toThrow(HttpError);

    try {
      parseDistinctSource({
        columnName: 'customer_email',
        schemaName: 'secret',
        tableName: 'enterprise_orders',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).statusCode).toBe(400);
    }
  });

  it('throws a 400 HttpError for a column outside the source allow-list', () => {
    try {
      parseDistinctSource({
        columnName: 'internal_notes',
        schemaName: 'public',
        tableName: 'enterprise_orders',
      });
      expect.unreachable('parseDistinctSource should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).statusCode).toBe(400);
      expect((error as HttpError).message).toBe(
        'Unsupported distinct column: internal_notes',
      );
    }
  });
});
