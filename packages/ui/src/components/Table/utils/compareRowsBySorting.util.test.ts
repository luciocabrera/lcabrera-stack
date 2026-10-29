import { describe, expect, it } from 'vite-plus/test';

import type { SortingState } from '#ui/components/Table/Table.types';

import { compareRowsBySorting } from './compareRowsBySorting.util';

type Row = { readonly group: string; readonly score: number };

const alpha: Row = { group: 'a', score: 2 };
const beta: Row = { group: 'a', score: 1 };
const gamma: Row = { group: 'b', score: 1 };

describe('compareRowsBySorting', () => {
  it('orders by the first sort that tells two rows apart', () => {
    const sorting: SortingState<Row> = [
      { columnKey: 'group', direction: 'asc' },
      { columnKey: 'score', direction: 'asc' },
    ];

    expect(
      compareRowsBySorting({ left: alpha, right: beta, sorting }),
    ).toBeGreaterThan(0);
    expect(
      compareRowsBySorting({ left: beta, right: gamma, sorting }),
    ).toBeLessThan(0);
  });

  it('reverses the order for a descending sort', () => {
    const sorting: SortingState<Row> = [
      { columnKey: 'score', direction: 'desc' },
    ];

    expect(
      compareRowsBySorting({ left: alpha, right: beta, sorting }),
    ).toBeLessThan(0);
  });

  it('skips an entry with no direction and keeps rows that tie', () => {
    const sorting: SortingState<Row> = [{ columnKey: 'score' }];

    expect(compareRowsBySorting({ left: alpha, right: beta, sorting })).toBe(0);
    expect(
      compareRowsBySorting({ left: beta, right: gamma, sorting: [] }),
    ).toBe(0);
  });
});
