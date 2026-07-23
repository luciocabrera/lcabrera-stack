import { describe, expect, it } from 'vite-plus/test';

import { sanitizeSorting } from './sanitizeSorting.util';

type TestRow = {
  readonly amount: number;
  readonly id: string;
  readonly status: string;
};

describe('sanitizeSorting', () => {
  it('returns empty array for empty input', () => {
    expect(sanitizeSorting<TestRow>([])).toEqual([]);
  });

  it('keeps entries with a defined direction', () => {
    const result = sanitizeSorting<TestRow>([
      { columnKey: 'status', direction: 'asc' },
      { columnKey: 'amount', direction: 'desc' },
    ]);
    expect(result).toEqual([
      { columnKey: 'status', direction: 'asc' },
      { columnKey: 'amount', direction: 'desc' },
    ]);
  });

  it('removes entries with undefined direction', () => {
    const result = sanitizeSorting<TestRow>([
      { columnKey: 'status', direction: 'asc' },
      { columnKey: 'id', direction: undefined },
    ]);
    expect(result).toEqual([{ columnKey: 'status', direction: 'asc' }]);
  });

  it('removes the "actions" column key', () => {
    const result = sanitizeSorting<TestRow>([
      { columnKey: 'actions', direction: 'asc' },
      { columnKey: 'status', direction: 'desc' },
    ]);
    expect(result).toEqual([{ columnKey: 'status', direction: 'desc' }]);
  });

  it('removes both undefined-direction and actions entries at once', () => {
    const result = sanitizeSorting<TestRow>([
      { columnKey: 'actions', direction: 'asc' },
      { columnKey: 'id', direction: undefined },
      { columnKey: 'amount', direction: 'desc' },
    ]);
    expect(result).toEqual([{ columnKey: 'amount', direction: 'desc' }]);
  });
});
