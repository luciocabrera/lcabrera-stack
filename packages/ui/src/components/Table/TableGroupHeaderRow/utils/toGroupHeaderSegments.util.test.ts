import { describe, expect, it } from 'vite-plus/test';

import type { NormalizedColumnsState } from '#ui/components/Table/Table.types';

import { toGroupHeaderSegments } from './toGroupHeaderSegments.util';

const normalizedColumns = {
  order_status: { key: 'order_status', label: 'Status' },
  shipping_country: { key: 'shipping_country', label: 'Country' },
  total_amount: { key: 'total_amount', label: 'Total' },
} as unknown as NormalizedColumnsState<Record<string, unknown>>;

describe('toGroupHeaderSegments', () => {
  it('names one key by its column label', () => {
    expect(
      toGroupHeaderSegments({
        normalizedColumns,
        summary: {
          aggregates: [],
          count: 12,
          path: [{ columnKey: 'order_status', label: 'Shipped' }],
        },
      }),
    ).toStrictEqual([{ key: 'key:order_status', text: 'Status: Shipped' }]);
  });

  it('names every key of a multi-key group, outermost first', () => {
    // Order is the query's nesting order, so it is information rather than
    // presentation — reversing it would describe a different grouping.
    expect(
      toGroupHeaderSegments({
        normalizedColumns,
        summary: {
          aggregates: [],
          count: 3,
          path: [
            { columnKey: 'order_status', label: 'Shipped' },
            { columnKey: 'shipping_country', label: 'USA' },
          ],
        },
      }).map(({ text }) => text),
    ).toStrictEqual(['Status: Shipped', 'Country: USA']);
  });

  it('names each aggregate by its function and its column', () => {
    expect(
      toGroupHeaderSegments({
        normalizedColumns,
        summary: {
          aggregates: [
            { columnKey: 'total_amount', fn: 'sum', label: '1,234.00' },
          ],
          count: 3,
          path: [{ columnKey: 'order_status', label: 'Shipped' }],
        },
      }).map(({ text }) => text),
    ).toStrictEqual(['Status: Shipped', 'Sum of Total: 1,234.00']);
  });

  it('falls back to the column key when the table declares no such column', () => {
    expect(
      toGroupHeaderSegments({
        normalizedColumns,
        summary: {
          aggregates: [],
          count: 1,
          path: [{ columnKey: 'not_a_column', label: 'x' }],
        },
      })[0]?.text,
    ).toBe('not_a_column: x');
  });

  it('gives a key segment and an aggregate segment on the same column distinct keys', () => {
    // Both are rendered as siblings, so a collision here would be a duplicate
    // React key on a row that legitimately groups by a column it also counts.
    const segments = toGroupHeaderSegments({
      normalizedColumns,
      summary: {
        aggregates: [{ columnKey: 'order_status', fn: 'count', label: '12' }],
        count: 12,
        path: [{ columnKey: 'order_status', label: 'Shipped' }],
      },
    });

    expect(new Set(segments.map(({ key }) => key)).size).toBe(segments.length);
  });
});
