import { OLAP_GROUP_ROW_FIELD } from '@lcabrera/api/olap/olap.constants';
import { describe, expect, it } from 'vite-plus/test';

import { toGroupRow } from './to-group-row.util';

const args = {
  aggregates: [],
  columnKeys: ['order_status'],
  countAlias: 'count_rows',
  maskAlias: 'group_mask',
} as const;

describe('toGroupRow', () => {
  it('builds a group row the table can render', () => {
    expect(
      toGroupRow({
        ...args,
        row: { count_rows: '12', group_mask: 0, order_status: 'Shipped' },
      }),
    ).toStrictEqual({
      [OLAP_GROUP_ROW_FIELD]: {
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
    const result = toGroupRow({
      ...args,
      columnKeys: ['order_status', 'shipping_country'],
      row: {
        count_rows: '5',
        group_mask: 0,
        order_status: 'Shipped',
        shipping_country: 'USA',
      },
    });

    expect(result[OLAP_GROUP_ROW_FIELD].path).toStrictEqual([
      { columnKey: 'order_status', label: 'Shipped', value: 'Shipped' },
      { columnKey: 'shipping_country', label: 'USA', value: 'USA' },
    ]);
  });

  it('decodes each aggregate by the alias the builder reported', () => {
    const result = toGroupRow({
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

    expect(result[OLAP_GROUP_ROW_FIELD].aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum', value: '1234.5600' },
    ]);
  });

  it('passes a NULL aggregate through rather than reading it as a label', () => {
    const row = JSON.parse(
      '{"avg_unit_price":null,"count_rows":"12","group_mask":0,"order_status":"Shipped"}',
    ) as Record<string, unknown>;

    const result = toGroupRow({
      ...args,
      aggregates: [
        { alias: 'avg_unit_price', columnKey: 'unit_price', fn: 'avg' },
      ],
      row,
    });

    expect(result[OLAP_GROUP_ROW_FIELD].aggregates).toStrictEqual(
      JSON.parse('[{"columnKey":"unit_price","fn":"avg","value":null}]'),
    );
  });

  it('coerces the count, which pg returns as a string for bigint', () => {
    const result = toGroupRow({
      ...args,
      row: { count_rows: '4', group_mask: 0, order_status: 'Pending' },
    });

    expect(result[OLAP_GROUP_ROW_FIELD].count).toBe(4);
  });

  it('reads a NULL key as a group rather than a missing one', () => {
    const result = toGroupRow({
      ...args,
      row: JSON.parse(
        '{"count_rows":"3","group_mask":0,"order_status":null}',
      ) as Record<string, unknown>,
    });

    expect(result[OLAP_GROUP_ROW_FIELD].path[0]?.label).toBe('(empty)');
    expect(result[OLAP_GROUP_ROW_FIELD].count).toBe(3);
    expect(result[OLAP_GROUP_ROW_FIELD].isSubtotal).toBe(false);
  });

  it('carries a NULL key as `null`, not as the string it renders as', () => {
    const result = toGroupRow({
      ...args,
      row: JSON.parse(
        '{"count_rows":"3","group_mask":0,"order_status":null}',
      ) as Record<string, unknown>,
    });
    const [key] = result[OLAP_GROUP_ROW_FIELD].path;

    expect(key?.label).toBe('(empty)');
    expect(key?.value).toBeNull();
  });

  it('carries the raw key beside the label for every dimension type', () => {
    const result = toGroupRow({
      ...args,
      columnKeys: ['is_gift', 'priority'],
      row: JSON.parse(
        '{"count_rows":"7","group_mask":0,"is_gift":true,"priority":42}',
      ) as Record<string, unknown>,
    });

    expect(result[OLAP_GROUP_ROW_FIELD].path).toStrictEqual([
      { columnKey: 'is_gift', label: 'true', value: true },
      { columnKey: 'priority', label: '42', value: 42 },
    ]);
  });

  it('tells a structural NULL apart from that real one by the mask alone', () => {
    const result = toGroupRow({
      ...args,
      row: JSON.parse(
        '{"count_rows":"3","group_mask":1,"order_status":null}',
      ) as Record<string, unknown>,
    });

    expect(result[OLAP_GROUP_ROW_FIELD].isSubtotal).toBe(true);
    expect(result[OLAP_GROUP_ROW_FIELD].path).toStrictEqual([]);
  });

  it('drops only the rolled-up levels, keeping the prefix that remains', () => {
    const result = toGroupRow({
      ...args,
      columnKeys: ['order_status', 'shipping_country'],
      row: JSON.parse(
        '{"count_rows":"9","group_mask":1,"order_status":"Shipped","shipping_country":null}',
      ) as Record<string, unknown>,
    });

    expect(result[OLAP_GROUP_ROW_FIELD].path).toStrictEqual([
      { columnKey: 'order_status', label: 'Shipped', value: 'Shipped' },
    ]);
    expect(result[OLAP_GROUP_ROW_FIELD].isSubtotal).toBe(true);
  });

  it('gives the grand total an empty path at depth zero', () => {
    const result = toGroupRow({
      ...args,
      columnKeys: ['order_status', 'shipping_country'],
      row: JSON.parse(
        '{"count_rows":"400","group_mask":3,"order_status":null,"shipping_country":null}',
      ) as Record<string, unknown>,
    });

    expect(result[OLAP_GROUP_ROW_FIELD].path).toStrictEqual([]);
    expect(result[OLAP_GROUP_ROW_FIELD].isSubtotal).toBe(true);
    expect(result[OLAP_GROUP_ROW_FIELD].count).toBe(400);
  });

  it('reads a missing mask as nothing rolled up, never as a subtotal', () => {
    const result = toGroupRow({
      ...args,
      row: { count_rows: '12', order_status: 'Shipped' },
    });

    expect(result[OLAP_GROUP_ROW_FIELD].isSubtotal).toBe(false);
    expect(result[OLAP_GROUP_ROW_FIELD].path).toStrictEqual([
      { columnKey: 'order_status', label: 'Shipped', value: 'Shipped' },
    ]);
  });

  it('falls back to a zero count rather than NaN when the alias is missing', () => {
    const result = toGroupRow({
      ...args,
      row: { group_mask: 0, order_status: 'Shipped' },
    });

    expect(result[OLAP_GROUP_ROW_FIELD].count).toBe(0);
  });

  it('carries no column values, so no cell renderer mistakes it for a data row', () => {
    const result = toGroupRow({
      ...args,
      row: { count_rows: '12', group_mask: 0, order_status: 'Shipped' },
    });

    expect(Object.keys(result)).toStrictEqual([OLAP_GROUP_ROW_FIELD]);
  });
});
