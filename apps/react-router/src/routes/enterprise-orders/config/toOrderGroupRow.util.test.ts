import { TABLE_GROUP_ROW_FIELD } from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it } from 'vite-plus/test';

import { toOrderGroupRow } from './toOrderGroupRow.util';

const args = {
  aggregates: [],
  columnKeys: ['order_status'],
  countAlias: 'count_rows',
} as const;

describe('toOrderGroupRow', () => {
  it('builds a group row the table can render', () => {
    expect(
      toOrderGroupRow({
        ...args,
        row: { count_rows: '12', order_status: 'Shipped' },
      }),
    ).toStrictEqual({
      [TABLE_GROUP_ROW_FIELD]: {
        aggregates: [],
        count: 12,
        path: [{ columnKey: 'order_status', label: 'Shipped' }],
      },
    });
  });

  it('names every level of a multi-key group, in the query nesting order', () => {
    const result = toOrderGroupRow({
      ...args,
      columnKeys: ['order_status', 'shipping_country'],
      row: {
        count_rows: '5',
        order_status: 'Shipped',
        shipping_country: 'USA',
      },
    });

    expect(result[TABLE_GROUP_ROW_FIELD].path).toStrictEqual([
      { columnKey: 'order_status', label: 'Shipped' },
      { columnKey: 'shipping_country', label: 'USA' },
    ]);
  });

  it('decodes each aggregate by the alias the builder reported', () => {
    // The alias is the builder's, never spelled here — a grouped row cannot be
    // decoded by a name the SQL did not project.
    const result = toOrderGroupRow({
      ...args,
      aggregates: [
        { alias: 'sum_total_amount', columnKey: 'total_amount', fn: 'sum' },
      ],
      row: {
        count_rows: '12',
        order_status: 'Shipped',
        sum_total_amount: '1234.5600',
      },
    });

    expect(result[TABLE_GROUP_ROW_FIELD].aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum', label: '1234.5600' },
    ]);
  });

  it('coerces the count, which pg returns as a string for bigint', () => {
    const result = toOrderGroupRow({
      ...args,
      row: { count_rows: '4', order_status: 'Pending' },
    });

    expect(result[TABLE_GROUP_ROW_FIELD].count).toBe(4);
  });

  it('reads a NULL key as a group rather than a missing one', () => {
    // Parsed rather than written as a literal: a SQL NULL arrives as the
    // driver's own `null`, which is what this branch exists for.
    const result = toOrderGroupRow({
      ...args,
      row: JSON.parse('{"count_rows":"3","order_status":null}') as Record<
        string,
        unknown
      >,
    });

    expect(result[TABLE_GROUP_ROW_FIELD].path[0]?.label).toBe('(empty)');
    expect(result[TABLE_GROUP_ROW_FIELD].count).toBe(3);
  });

  it('falls back to a zero count rather than NaN when the alias is missing', () => {
    const result = toOrderGroupRow({
      ...args,
      row: { order_status: 'Shipped' },
    });

    expect(result[TABLE_GROUP_ROW_FIELD].count).toBe(0);
  });

  it('carries no column values, so no cell renderer mistakes it for a data row', () => {
    const result = toOrderGroupRow({
      ...args,
      row: { count_rows: '12', group_mask: 0, order_status: 'Shipped' },
    });

    expect(Object.keys(result)).toStrictEqual([TABLE_GROUP_ROW_FIELD]);
  });
});
