import { describe, expect, it } from 'vite-plus/test';

import { COLUMNS, TARGET } from './Orders.constants';

describe('the columns this route declares', () => {
  it('declares at least one', () => {
    expect(COLUMNS.length).toBeGreaterThan(0);
  });

  it('are exactly the columns the read accepts', () => {
    expect(TARGET.allowedColumns).toEqual(
      COLUMNS.map((column) => String(column.key)),
    );
  });

  it('offers a sort on every one, because the read orders by each', () => {
    const unsortable = COLUMNS.filter(
      (column) => column.isSortable === false,
    ).map((column) => column.label);

    expect(unsortable).toEqual([]);
  });

  it('offers a filter on every one, because the read filters by each', () => {
    const unfilterable = COLUMNS.filter(
      (column) => column.isFilterable === false,
    ).map((column) => column.label);

    expect(unfilterable).toEqual([]);
  });
});
