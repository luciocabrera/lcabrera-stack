import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { toGroupKeyItems } from './toGroupKeyItems.util';

type TestRow = {
  readonly order_status: string;
  readonly shipping_country: string;
};

const columns: TableColumn<TestRow>[] = [
  { key: 'order_status', label: 'Status' },
  { key: 'shipping_country', label: 'Country' },
];

describe('toGroupKeyItems', () => {
  it('labels each applied key from its column', () => {
    expect(toGroupKeyItems({ columns, keys: ['order_status'] })).toStrictEqual([
      { columnKey: 'order_status', label: 'Status' },
    ]);
  });

  it('keeps the keys in nesting order, not in column display order', () => {
    // The probe that discriminates: these two keys are declared in the opposite
    // order on `columns`, so a version driven off the columns would pass a
    // same-order case and fail only here.
    expect(
      toGroupKeyItems({
        columns,
        keys: ['shipping_country', 'order_status'],
      }).map(({ label }) => label),
    ).toStrictEqual(['Country', 'Status']);
  });

  it('falls back to the key for a column the table does not declare', () => {
    expect(toGroupKeyItems({ columns, keys: ['not_a_column'] })).toStrictEqual([
      { columnKey: 'not_a_column', label: 'not_a_column' },
    ]);
  });

  it('answers empty for an ungrouped table', () => {
    expect(toGroupKeyItems({ columns, keys: [] })).toStrictEqual([]);
  });
});
