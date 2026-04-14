import { describe, expect, it } from 'vitest';

import { formatPgAdminQuery } from './formatPgAdminQuery.util';

describe('api-server formatPgAdminQuery', () => {
  it('re-exports the shared query formatter', () => {
    expect(formatPgAdminQuery('SELECT $1 AS customer', ["O'Hara"])).toBe(
      "SELECT 'O''Hara' AS customer",
    );
  });
});
