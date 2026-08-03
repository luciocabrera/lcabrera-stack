import { describe, expect, it } from 'vite-plus/test';

import { toQuerySort } from './toQuerySort.util';

type TestRow = {
  readonly amount: number;
  readonly id: string;
  readonly status: string;
};

describe('toQuerySort', () => {
  it('returns an empty array for empty sorting', () => {
    expect(toQuerySort<TestRow>({ sorting: [] })).toEqual([]);
  });

  it('renames columnKey to column, preserving order and direction', () => {
    expect(
      toQuerySort<TestRow>({
        sorting: [
          { columnKey: 'status', direction: 'desc' },
          { columnKey: 'amount', direction: 'asc' },
        ],
      }),
    ).toEqual([
      { column: 'status', direction: 'desc' },
      { column: 'amount', direction: 'asc' },
    ]);
  });

  it('skips the synthetic actions column', () => {
    expect(
      toQuerySort<TestRow>({
        sorting: [
          { columnKey: 'actions', direction: 'asc' },
          { columnKey: 'id', direction: 'asc' },
        ],
      }),
    ).toEqual([{ column: 'id', direction: 'asc' }]);
  });

  it('drops an entry with no direction rather than assuming one', () => {
    expect(
      toQuerySort<TestRow>({
        sorting: [
          { columnKey: 'status', direction: 'desc' },
          { columnKey: 'id' },
        ],
      }),
    ).toEqual([{ column: 'status', direction: 'desc' }]);
  });
});
