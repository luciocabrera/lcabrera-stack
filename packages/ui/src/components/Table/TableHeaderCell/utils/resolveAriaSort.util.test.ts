import { describe, expect, it } from 'vite-plus/test';

import { resolveAriaSort } from './resolveAriaSort.util';

describe('resolveAriaSort', () => {
  it('announces the applied sort direction', () => {
    expect(resolveAriaSort({ isSortable: true, sortDirection: 'asc' })).toBe(
      'ascending',
    );
    expect(resolveAriaSort({ isSortable: true, sortDirection: 'desc' })).toBe(
      'descending',
    );
  });

  it('announces a sortable column that is currently unsorted as none', () => {
    expect(
      resolveAriaSort({ isSortable: true, sortDirection: undefined }),
    ).toBe('none');
  });

  it('says nothing at all about a column that cannot be sorted', () => {
    // `none` would advertise an action that is not there; the absent attribute
    // says the column does not participate in sorting.
    expect(
      resolveAriaSort({ isSortable: false, sortDirection: undefined }),
    ).toBeUndefined();
    expect(
      resolveAriaSort({ isSortable: false, sortDirection: 'asc' }),
    ).toBeUndefined();
  });
});
