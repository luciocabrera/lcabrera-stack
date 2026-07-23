import { describe, expect, it } from 'vite-plus/test';

import { getTotalRows } from './getTotalRows.util';

type TestResponse = {
  readonly rows: readonly string[];
  readonly total: number;
};

describe('getTotalRows', () => {
  it('returns the selector result when dataTotalSelector is provided', () => {
    const response: TestResponse = { rows: ['a', 'b'], total: 100 };

    expect(
      getTotalRows({
        data: ['a', 'b'],
        dataTotalSelector: (r) => r.total,
        response,
      }),
    ).toBe(100);
  });

  it('returns data.length when dataTotalSelector is absent', () => {
    const response: TestResponse = { rows: ['a', 'b'], total: 100 };

    expect(getTotalRows({ data: ['a', 'b'], response })).toBe(2);
  });

  it('returns 0 when data is empty and no selector is provided', () => {
    const response: TestResponse = { rows: [], total: 0 };

    expect(getTotalRows({ data: [], response })).toBe(0);
  });
});
