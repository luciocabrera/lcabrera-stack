import { describe, expect, it } from 'vitest';

import { resolveSelectAllFilter } from './resolveSelectAllFilter.util';

describe('resolveSelectAllFilter', () => {
  it('selects every visible option, deduplicating existing selection', () => {
    expect(
      resolveSelectAllFilter({
        filteredOptions: ['a', 'b'],
        isAllSelected: false,
        selectedValues: ['b', 'c'],
      }),
    ).toEqual({ type: 'select', values: ['b', 'c', 'a'] });
  });

  it('deselects only the visible options when all are selected', () => {
    expect(
      resolveSelectAllFilter({
        filteredOptions: ['a', 'b'],
        isAllSelected: true,
        selectedValues: ['a', 'b', 'c'],
      }),
    ).toEqual({ type: 'select', values: ['c'] });
  });
});
