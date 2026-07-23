import { describe, expect, it } from 'vite-plus/test';

import { formatPgAdminQuery } from './formatPgAdminQuery.util';

describe('api-server-fast formatPgAdminQuery', () => {
  it('re-exports the shared query formatter', () => {
    expect(formatPgAdminQuery('SELECT $1 AS customer', ["O'Hara"])).toBe(
      "SELECT 'O''Hara' AS customer",
    );
  });
});
