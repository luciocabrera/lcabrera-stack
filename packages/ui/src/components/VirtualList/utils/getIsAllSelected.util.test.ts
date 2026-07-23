import { describe, expect, it } from 'vite-plus/test';

import { getIsAllSelected } from './getIsAllSelected.util';

describe('getIsAllSelected', () => {
  it('returns true when every filtered option is selected', () => {
    expect(
      getIsAllSelected({
        filteredOptions: ['a', 'b'],
        selectedValues: ['b', 'a', 'c'],
      }),
    ).toBe(true);
  });

  it('returns false when at least one filtered option is unselected', () => {
    expect(
      getIsAllSelected({
        filteredOptions: ['a', 'b'],
        selectedValues: ['a'],
      }),
    ).toBe(false);
  });

  it('returns false when there are no filtered options', () => {
    expect(
      getIsAllSelected({ filteredOptions: [], selectedValues: ['a'] }),
    ).toBe(false);
  });
});
