import { describe, expect, it } from 'vite-plus/test';

import { TABLE_GROUP_ROW_FIELD } from '../Table.constants';
import { getTableGroupRowSummary } from './getTableGroupRowSummary.util';

const summary = {
  aggregates: [],
  count: 12,
  isSubtotal: false,
  path: [{ columnKey: 'order_status', label: 'Shipped', value: 'Shipped' }],
};

describe('getTableGroupRowSummary', () => {
  it('reads a well-formed summary off a group row', () => {
    expect(
      getTableGroupRowSummary({
        order_status: 'Shipped',
        [TABLE_GROUP_ROW_FIELD]: summary,
      }),
    ).toStrictEqual(summary);
  });

  it('reads a multi-key path in the order it was written', () => {
    const path = [
      { columnKey: 'order_status', label: 'Shipped', value: 'Shipped' },
      { columnKey: 'shipping_country', label: 'USA', value: 'USA' },
    ];

    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { ...summary, path },
      })?.path,
    ).toStrictEqual(path);
  });

  it('reads the aggregates a grouped read attached', () => {
    const aggregates = [
      { columnKey: 'total_amount', fn: 'sum', value: '302540833.38' },
    ];

    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { ...summary, aggregates },
      })?.aggregates,
    ).toStrictEqual(aggregates);
  });

  it('keeps a SQL NULL aggregate rather than rejecting the summary', () => {
    // `avg` over a group whose rows are all NULL returns SQL NULL. That is a
    // value the cell renders as an absence, not a malformed summary — and it
    // is why `value` is checked for presence rather than for type.
    //
    // Parsed rather than written as a literal, for the reason given below: a
    // JSON `null` is exactly how such a value reaches a row across the loader
    // boundary, and it is the shape under test rather than an incidental one.
    const aggregates = JSON.parse(
      '[{"columnKey":"unit_price","fn":"avg","value":null}]',
    ) as readonly unknown[];

    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { ...summary, aggregates },
      })?.aggregates,
    ).toStrictEqual(aggregates);
  });

  it('refuses an aggregate carrying no value at all', () => {
    // The other side of that coin: absent is malformed where null is data.
    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: {
          ...summary,
          aggregates: [{ columnKey: 'unit_price', fn: 'avg' }],
        },
      }),
    ).toBeUndefined();
  });

  it('answers undefined for an ordinary data row', () => {
    expect(
      getTableGroupRowSummary({ order_id: 1, order_status: 'Shipped' }),
    ).toBeUndefined();
  });

  it('returns only the summary members, never the row', () => {
    const result = getTableGroupRowSummary({
      [TABLE_GROUP_ROW_FIELD]: { ...summary, unexpected: 'x' },
    });

    expect(
      Object.keys(result ?? {}).toSorted((a, b) => a.localeCompare(b)),
    ).toStrictEqual(['aggregates', 'count', 'isSubtotal', 'path']);
  });

  it('refuses a partial summary rather than rendering a hole', () => {
    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { count: 12, path: summary.path },
      }),
    ).toBeUndefined();
    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { ...summary, count: '12' },
      }),
    ).toBeUndefined();
    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { ...summary, isSubtotal: 'yes' },
      }),
    ).toBeUndefined();
  });

  it('accepts a NULL key value and refuses a path entry with no `value` key', () => {
    // Presence, not type — the same distinction the aggregate side draws. A
    // NULL key is a real group and must survive; an entry that never carried
    // the field is malformed and must take the whole summary down, because a
    // group described by some of its keys is not the group the row holds.
    const withNull = JSON.parse(
      '[{"columnKey":"order_status","label":"(empty)","value":null}]',
    ) as readonly unknown[];

    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { ...summary, path: withNull },
      })?.path,
      // Compared against the parsed input rather than a `null` literal, so the
      // expected value has the shape a driver actually returns. `toStrictEqual`
      // is deep equality, not identity — the guard rebuilds each entry in
      // `toKeyValue`, so identity would fail here by design. What this pins is
      // that the NULL survives the rebuild uncoerced.
    ).toStrictEqual(withNull);

    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: {
          ...summary,
          path: [{ columnKey: 'order_status', label: 'Shipped' }],
        },
      }),
    ).toBeUndefined();
  });

  it('reads an empty path as the grand total, not as a malformed summary', () => {
    // A rollup's grand total is keyed by nothing, so an empty path is the one
    // row it produces — refusing it would drop exactly the row rollup exists
    // for, and it would arrive as an ordinary data row with no columns.
    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { ...summary, isSubtotal: true, path: [] },
      }),
    ).toStrictEqual({ ...summary, isSubtotal: true, path: [] });
  });

  it('carries the subtotal flag, which the text alone cannot say', () => {
    // The two rows this separates are textually identical: a real NULL key and
    // a subtotal over that key both render an empty label from the same column.
    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { ...summary, isSubtotal: true },
      })?.isSubtotal,
    ).toBe(true);
  });

  it('refuses the whole summary when one path entry is malformed', () => {
    // A two-key group described by one key is not the group the row holds, so
    // rendering the good half would label it wrongly rather than incompletely.
    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: {
          ...summary,
          path: [
            { columnKey: 'order_status', label: 'Shipped', value: 'Shipped' },
            { columnKey: 'shipping_country' },
          ],
        },
      }),
    ).toBeUndefined();
  });

  it('refuses an aggregate whose function is outside the vocabulary', () => {
    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: {
          ...summary,
          aggregates: [{ columnKey: 'total_amount', fn: 'median', value: '1' }],
        },
      }),
    ).toBeUndefined();
  });

  it('refuses a non-object in the group field', () => {
    // Parsed rather than written as a literal, because a JSON `null` is exactly
    // how such a value reaches a row across the loader boundary.
    const nulledField = JSON.parse(
      `{"${TABLE_GROUP_ROW_FIELD}":null}`,
    ) as Record<string, unknown>;

    expect(
      getTableGroupRowSummary({ [TABLE_GROUP_ROW_FIELD]: 'Shipped' }),
    ).toBeUndefined();
    expect(getTableGroupRowSummary(nulledField)).toBeUndefined();
  });
});
