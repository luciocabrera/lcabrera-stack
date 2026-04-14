import { describe, expect, it } from 'vitest';

import { formatPgAdminQuery } from './formatPgAdminQuery.util.js';

describe('formatPgAdminQuery', () => {
  it('formats booleans, dates, nulls, numbers, and escaped strings', () => {
    expect(
      formatPgAdminQuery(
        'SELECT * FROM orders WHERE customer = $1 AND active = $2 AND total = $3 AND archived_at IS $4 AND created_at = $5',
        ["O'Hara", true, 42, null, new Date('2024-01-15T12:00:00.000Z')],
      ),
    ).toBe(
      "SELECT * FROM orders WHERE customer = 'O''Hara' AND active = TRUE AND total = 42 AND archived_at IS NULL AND created_at = '2024-01-15T12:00:00.000Z'",
    );
  });

  it('replaces numbered placeholders without partially matching higher indexes', () => {
    expect(
      formatPgAdminQuery(
        'SELECT $1 AS first, $10 AS tenth',
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      ),
    ).toBe('SELECT 1 AS first, 10 AS tenth');
  });
});
