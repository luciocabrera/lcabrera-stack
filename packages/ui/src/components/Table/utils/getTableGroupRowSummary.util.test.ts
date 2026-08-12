import { describe, expect, it } from 'vite-plus/test';

import { TABLE_GROUP_ROW_FIELD } from '../Table.constants';
import { getTableGroupRowSummary } from './getTableGroupRowSummary.util';

const summary = {
  aggregates: [],
  count: 12,
  path: [{ columnKey: 'order_status', label: 'Shipped' }],
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
      { columnKey: 'order_status', label: 'Shipped' },
      { columnKey: 'shipping_country', label: 'USA' },
    ];

    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { ...summary, path },
      })?.path,
    ).toStrictEqual(path);
  });

  it('reads the aggregates a grouped read attached', () => {
    const aggregates = [
      { columnKey: 'total_amount', fn: 'sum', label: '1,234.00' },
    ];

    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { ...summary, aggregates },
      })?.aggregates,
    ).toStrictEqual(aggregates);
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
    ).toStrictEqual(['aggregates', 'count', 'path']);
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
        [TABLE_GROUP_ROW_FIELD]: { ...summary, path: [] },
      }),
    ).toBeUndefined();
  });

  it('refuses the whole summary when one path entry is malformed', () => {
    // A two-key group described by one key is not the group the row holds, so
    // rendering the good half would label it wrongly rather than incompletely.
    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: {
          ...summary,
          path: [
            { columnKey: 'order_status', label: 'Shipped' },
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
          aggregates: [{ columnKey: 'total_amount', fn: 'median', label: '1' }],
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
