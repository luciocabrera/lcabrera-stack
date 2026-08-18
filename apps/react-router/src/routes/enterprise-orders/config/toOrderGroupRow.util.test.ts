import { TABLE_GROUP_ROW_FIELD } from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it } from 'vite-plus/test';

import { toOrderGroupRow } from './toOrderGroupRow.util';

const args = {
  aggregates: [],
  columnKeys: ['order_status'],
  countAlias: 'count_rows',
  maskAlias: 'group_mask',
} as const;

describe('toOrderGroupRow', () => {
  it('builds a group row the table can render', () => {
    expect(
      toOrderGroupRow({
        ...args,
        row: { count_rows: '12', group_mask: 0, order_status: 'Shipped' },
      }),
    ).toStrictEqual({
      [TABLE_GROUP_ROW_FIELD]: {
        aggregates: [],
        count: 12,
        isSubtotal: false,
        path: [
          { columnKey: 'order_status', label: 'Shipped', value: 'Shipped' },
        ],
      },
    });
  });

  it('names every level of a multi-key group, in the query nesting order', () => {
    const result = toOrderGroupRow({
      ...args,
      columnKeys: ['order_status', 'shipping_country'],
      row: {
        count_rows: '5',
        group_mask: 0,
        order_status: 'Shipped',
        shipping_country: 'USA',
      },
    });

    expect(result[TABLE_GROUP_ROW_FIELD].path).toStrictEqual([
      { columnKey: 'order_status', label: 'Shipped', value: 'Shipped' },
      { columnKey: 'shipping_country', label: 'USA', value: 'USA' },
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
        group_mask: 0,
        order_status: 'Shipped',
        sum_total_amount: '1234.5600',
      },
    });

    // The value passes through untouched, at the scale `pg` reported it. How
    // much of it to show is the column's decision, made at the cell — deciding
    // it here is what put a raw `numeric` string under a currency header.
    expect(result[TABLE_GROUP_ROW_FIELD].aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum', value: '1234.5600' },
    ]);
  });

  it('passes a NULL aggregate through rather than reading it as a label', () => {
    // `avg` over a group whose rows are all NULL is SQL NULL. It stays null so
    // the cell can render it as an absence; `(empty)` here would apply a
    // group-key reading to a measure.
    //
    // Parsed rather than written as a literal, because a JSON `null` is how a
    // NULL column reaches this decoder — and it is the shape under test, not an
    // incidental one.
    const row = JSON.parse(
      '{"avg_unit_price":null,"count_rows":"12","group_mask":0,"order_status":"Shipped"}',
    ) as Record<string, unknown>;

    const result = toOrderGroupRow({
      ...args,
      aggregates: [
        { alias: 'avg_unit_price', columnKey: 'unit_price', fn: 'avg' },
      ],
      row,
    });

    expect(result[TABLE_GROUP_ROW_FIELD].aggregates).toStrictEqual(
      JSON.parse('[{"columnKey":"unit_price","fn":"avg","value":null}]'),
    );
  });

  it('coerces the count, which pg returns as a string for bigint', () => {
    const result = toOrderGroupRow({
      ...args,
      row: { count_rows: '4', group_mask: 0, order_status: 'Pending' },
    });

    expect(result[TABLE_GROUP_ROW_FIELD].count).toBe(4);
  });

  it('reads a NULL key as a group rather than a missing one', () => {
    // Parsed rather than written as a literal: a SQL NULL arrives as the
    // driver's own `null`, which is what this branch exists for.
    const result = toOrderGroupRow({
      ...args,
      row: JSON.parse(
        '{"count_rows":"3","group_mask":0,"order_status":null}',
      ) as Record<string, unknown>,
    });

    expect(result[TABLE_GROUP_ROW_FIELD].path[0]?.label).toBe('(empty)');
    expect(result[TABLE_GROUP_ROW_FIELD].count).toBe(3);
    expect(result[TABLE_GROUP_ROW_FIELD].isSubtotal).toBe(false);
  });

  it('carries a NULL key as `null`, not as the string it renders as', () => {
    // The pair that makes both fields necessary. `(empty)` is the right thing
    // to *print* and the wrong thing to *query* — `order_status = '(empty)'`
    // matches no row, and nothing raises. So the label stays formatted and the
    // value stays raw, on the one group where the difference is silent.
    const result = toOrderGroupRow({
      ...args,
      row: JSON.parse(
        '{"count_rows":"3","group_mask":0,"order_status":null}',
      ) as Record<string, unknown>,
    });
    const [key] = result[TABLE_GROUP_ROW_FIELD].path;

    expect(key?.label).toBe('(empty)');
    expect(key?.value).toBeNull();
  });

  it('carries the raw key beside the label for every dimension type', () => {
    // A boolean key renders as `'true'` and a number as `'42'`; both are
    // strings once formatted, and neither round-trips back to a value. Parsed
    // from JSON so the types are the driver's, not a literal's.
    const result = toOrderGroupRow({
      ...args,
      columnKeys: ['is_gift', 'priority'],
      row: JSON.parse(
        '{"count_rows":"7","group_mask":0,"is_gift":true,"priority":42}',
      ) as Record<string, unknown>,
    });

    expect(result[TABLE_GROUP_ROW_FIELD].path).toStrictEqual([
      { columnKey: 'is_gift', label: 'true', value: true },
      { columnKey: 'priority', label: '42', value: 42 },
    ]);
  });

  it('tells a structural NULL apart from that real one by the mask alone', () => {
    // The discriminating pair. Same column, same NULL, same text as the row
    // above — that one has `group_mask: 0` and is a real NULL group, this one
    // has the bit set and is the subtotal across every status. Nothing but the
    // mask separates them, which is why it is shipped beside the rows.
    const result = toOrderGroupRow({
      ...args,
      row: JSON.parse(
        '{"count_rows":"3","group_mask":1,"order_status":null}',
      ) as Record<string, unknown>,
    });

    expect(result[TABLE_GROUP_ROW_FIELD].isSubtotal).toBe(true);
    expect(result[TABLE_GROUP_ROW_FIELD].path).toStrictEqual([]);
  });

  it('drops only the rolled-up levels, keeping the prefix that remains', () => {
    // Mask 1 over two keys: bit 0 belongs to the *second* key, so the first
    // survives. Reading the bits the other way round would drop the wrong
    // level and put the subtotal at the wrong depth.
    const result = toOrderGroupRow({
      ...args,
      columnKeys: ['order_status', 'shipping_country'],
      // Parsed rather than written as a literal: a rolled-up key arrives as
      // the driver's own `null`, exactly like a real one — which is the whole
      // reason the mask has to be read.
      row: JSON.parse(
        '{"count_rows":"9","group_mask":1,"order_status":"Shipped","shipping_country":null}',
      ) as Record<string, unknown>,
    });

    expect(result[TABLE_GROUP_ROW_FIELD].path).toStrictEqual([
      { columnKey: 'order_status', label: 'Shipped', value: 'Shipped' },
    ]);
    expect(result[TABLE_GROUP_ROW_FIELD].isSubtotal).toBe(true);
  });

  it('gives the grand total an empty path at depth zero', () => {
    const result = toOrderGroupRow({
      ...args,
      columnKeys: ['order_status', 'shipping_country'],
      row: JSON.parse(
        '{"count_rows":"400","group_mask":3,"order_status":null,"shipping_country":null}',
      ) as Record<string, unknown>,
    });

    expect(result[TABLE_GROUP_ROW_FIELD].path).toStrictEqual([]);
    expect(result[TABLE_GROUP_ROW_FIELD].isSubtotal).toBe(true);
    expect(result[TABLE_GROUP_ROW_FIELD].count).toBe(400);
  });

  it('reads a missing mask as nothing rolled up, never as a subtotal', () => {
    // The safe direction: a decode that invented a subtotal would relabel a
    // real group as a total of itself.
    const result = toOrderGroupRow({
      ...args,
      row: { count_rows: '12', order_status: 'Shipped' },
    });

    expect(result[TABLE_GROUP_ROW_FIELD].isSubtotal).toBe(false);
    expect(result[TABLE_GROUP_ROW_FIELD].path).toStrictEqual([
      { columnKey: 'order_status', label: 'Shipped', value: 'Shipped' },
    ]);
  });

  it('falls back to a zero count rather than NaN when the alias is missing', () => {
    const result = toOrderGroupRow({
      ...args,
      row: { group_mask: 0, order_status: 'Shipped' },
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
