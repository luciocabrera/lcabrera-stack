import { describe, expect, it } from 'vite-plus/test';

import { COLUMNS } from './Orders.constants';

describe('the columns this route declares', () => {
  it('declares at least one', () => {
    expect(COLUMNS.length).toBeGreaterThan(0);
  });

  it('offers no sort, because the loader resolves none', () => {
    const sortable = COLUMNS.filter(
      (column) => column.isSortable !== false,
    ).map((column) => column.label);

    expect(sortable).toEqual([]);
  });

  it('offers no filter, because the loader applies none', () => {
    const filterable = COLUMNS.filter(
      (column) => column.isFilterable !== false,
    ).map((column) => column.label);

    expect(filterable).toEqual([]);
  });
});
