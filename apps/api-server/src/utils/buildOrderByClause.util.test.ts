import { describe, expect, it } from 'vitest';

import { buildOrderByClause } from './buildOrderByClause.util';

describe('api-server buildOrderByClause', () => {
  it('re-exports the shared ORDER BY helper', () => {
    expect(
      buildOrderByClause({
        fallbackSorting: [{ columnKey: 'id', direction: 'asc' }],
        sorting: [{ columnKey: 'created_at', direction: 'desc' }],
      }),
    ).toBe('ORDER BY created_at DESC');
  });
});
