import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnsState,
} from '#ui/components/Table/Table.types';

import { getInitialColumnsState } from '#ui/components/Table/contexts/TableConfig/utils';

import { resolveGroupingColumnsPatch } from './resolveGroupingColumnsPatch.util';

type Row = Record<string, unknown>;

const columns: TableColumn<Row>[] = [
  { key: 'order_status', label: 'Status' },
  { key: 'total_amount', label: 'Amount' },
  { key: 'ship_country', label: 'Country' },
];

const columnsState = getInitialColumnsState<Row>({
  // `total_amount` pinned left and ordered ahead of the key on purpose: the
  // hoist has to beat both, which is what makes "no column can sit between two
  // group keys" a property rather than a coincidence (ADR-080).
  columnOrder: ['total_amount', 'order_status', 'ship_country'],
  columnPinning: { left: ['total_amount'], right: [] },
  columns,
}) as TableColumnsState<Row>;

const patch = (groupingKeys: readonly string[]) =>
  resolveGroupingColumnsPatch<Row>({
    aggregates: [],
    columnsState,
    groupingKeys,
  });

describe('resolveGroupingColumnsPatch', () => {
  it('hoists the group keys to the head of the painted grid, in key order', () => {
    // Ahead of `total_amount`, which the user both ordered first and pinned
    // left. The keys land at indices 0…N-1 whatever the saved layout says.
    expect(
      patch(['ship_country', 'order_status']).effectiveColumns.map(
        (col) => col.key,
      ),
    ).toStrictEqual(['ship_country', 'order_status', 'total_amount']);
  });

  it('adds no column of its own', () => {
    // The synthetic hierarchy column is retired: a grouped row paints exactly
    // the columns the consumer declared, one cell fewer than before (ADR-080).
    expect(patch(['order_status']).effectiveColumns).toHaveLength(
      columns.length,
    );
  });

  it('leaves no column between two group keys', () => {
    const keys = patch(['ship_country', 'order_status'])
      .effectiveColumns.map((col) => String(col.key))
      .filter((key) => key !== 'total_amount');

    expect(keys).toStrictEqual(['ship_country', 'order_status']);
  });

  it('restores the user layout exactly when grouping goes off', () => {
    expect(
      patch([]).pinnedColumnPartition.leftPinnedCols.map((col) => col.key),
    ).toStrictEqual(['total_amount']);
    expect(patch([]).effectiveColumns.map((col) => col.key)).toStrictEqual([
      'total_amount',
      'order_status',
      'ship_country',
    ]);
  });

  it('moves a key out of the right pin rather than duplicating it', () => {
    const pinnedRight = getInitialColumnsState<Row>({
      columnPinning: { left: [], right: ['order_status'] },
      columns,
    }) as TableColumnsState<Row>;
    const grouped = resolveGroupingColumnsPatch<Row>({
      aggregates: [],
      columnsState: pinnedRight,
      groupingKeys: ['order_status'],
    });

    expect(
      grouped.effectiveColumns.filter((col) => col.key === 'order_status'),
    ).toHaveLength(1);
    expect(
      grouped.pinnedColumnPartition.rightPinnedCols.map((col) => col.key),
    ).not.toContain('order_status');
  });

  it('patches the derived slices and the sort, never the layout the user owns', () => {
    // The grouped layout is a rendering of the grouping configuration, so it
    // must not reach the cookie the layout persists through or the list the
    // settings drawer offers — which is what makes ungrouping free.
    //
    // `sorting` is the one exception and it is a correction rather than a
    // preference: a measure column exists only while its aggregate is applied,
    // so a grouping change can take away the column the sort names, and the
    // ungrouped read refuses an unknown column rather than ignoring it.
    // `columns`, `columnOrder` and `columnPinning` stay out.
    expect(
      Object.keys(patch(['order_status'])).toSorted((a, b) =>
        a.localeCompare(b),
      ),
    ).toStrictEqual([
      'effectiveColumns',
      'normalizedColumns',
      'pinnedColumnOffsets',
      'pinnedColumnPartition',
      'sorting',
      'staticKeys',
    ]);
  });
});
