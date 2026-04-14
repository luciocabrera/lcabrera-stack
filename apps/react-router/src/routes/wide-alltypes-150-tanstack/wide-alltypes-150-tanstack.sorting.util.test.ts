import { describe, expect, it } from 'vitest';

import {
  toTanStackSortingState,
  toWideAlltypes150ApiSorting,
  toWideAlltypes150SortSearchParam,
} from './wide-alltypes-150-tanstack.sorting.util';

describe('wide-alltypes-150-tanstack sorting utils', () => {
  it('converts app sorting state to TanStack sorting state', () => {
    const sorting = [
      { columnKey: 'c_001', direction: 'asc' },
      { columnKey: 'c_002', direction: 'desc' },
    ] as Parameters<typeof toTanStackSortingState>[0];

    expect(toTanStackSortingState(sorting)).toEqual([
      { desc: false, id: 'c_001' },
      { desc: true, id: 'c_002' },
    ]);
  });

  it('converts TanStack sorting state to API sorting rules', () => {
    expect(
      toWideAlltypes150ApiSorting([
        { desc: true, id: 'c_001' },
        { desc: false, id: 'c_002' },
      ]),
    ).toEqual([
      { columnKey: 'c_001', direction: 'desc' },
      { columnKey: 'c_002', direction: 'asc' },
    ]);
  });

  it('serializes TanStack sorting state to the shared sort param format', () => {
    expect(
      toWideAlltypes150SortSearchParam([
        { desc: true, id: 'c_001' },
        { desc: false, id: 'c_002' },
      ]),
    ).toBe('{"c_001":"desc","c_002":"asc"}');
  });

  it('returns undefined when there is no sortable direction to serialize', () => {
    expect(toWideAlltypes150SortSearchParam([])).toBeUndefined();
  });
});
