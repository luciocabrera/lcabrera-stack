import { describe, expect, it } from 'vite-plus/test';

import { TABLE_GROUP_ROW_FIELD } from '../Table.constants';
import { getTableGroupRowSummary } from './getTableGroupRowSummary.util';

const summary = { columnKey: 'order_status', count: 12, label: 'Shipped' };

describe('getTableGroupRowSummary', () => {
  it('reads a well-formed summary off a group row', () => {
    expect(
      getTableGroupRowSummary({
        order_status: 'Shipped',
        [TABLE_GROUP_ROW_FIELD]: summary,
      }),
    ).toStrictEqual(summary);
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
    ).toStrictEqual(['columnKey', 'count', 'label']);
  });

  it('refuses a partial summary rather than rendering a hole', () => {
    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { columnKey: 'order_status', count: 12 },
      }),
    ).toBeUndefined();
    expect(
      getTableGroupRowSummary({
        [TABLE_GROUP_ROW_FIELD]: { ...summary, count: '12' },
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
