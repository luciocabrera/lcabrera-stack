import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnsState,
} from '#ui/components/Table/Table.types';

import { getInitialColumnsState } from '#ui/components/Table/contexts/TableConfig/utils';
import { TABLE_GROUP_HIERARCHY_COLUMN_KEY } from '#ui/components/Table/Table.constants';

import { resolveGroupingColumnsPatch } from './resolveGroupingColumnsPatch.util';

type Row = Record<string, unknown>;

const columns: TableColumn<Row>[] = [
  { key: 'order_status', label: 'Status' },
  { key: 'total_amount', label: 'Amount' },
];

const columnsState = getInitialColumnsState<Row>({
  columnPinning: { left: ['order_status'], right: [] },
  columns,
}) as TableColumnsState<Row>;

const patch = (groupingKeys: readonly string[]) =>
  resolveGroupingColumnsPatch<Row>({ columnsState, groupingKeys });

describe('resolveGroupingColumnsPatch', () => {
  it('adds the hierarchy column to the painted partition when grouping goes on', () => {
    expect(
      patch(['order_status']).pinnedColumnPartition.leftPinnedCols.map(
        (col) => col.key,
      ),
    ).toStrictEqual([TABLE_GROUP_HIERARCHY_COLUMN_KEY, 'order_status']);
  });

  it('takes it away again when grouping goes off', () => {
    expect(
      patch([]).pinnedColumnPartition.leftPinnedCols.map((col) => col.key),
    ).toStrictEqual(['order_status']);
  });

  it('gives it the label the grouping states, so the header names the keys', () => {
    expect(
      patch(['order_status']).normalizedColumns[
        TABLE_GROUP_HIERARCHY_COLUMN_KEY
      ]?.label,
    ).toBe('Status');
  });

  it('shifts the consumer-pinned columns right by its width', () => {
    // Sticky offsets are a running sum over the left-pinned columns, so a
    // hierarchy column that did not take part would leave the columns behind
    // it overlapping (ADR-065).
    const grouped = patch(['order_status']);

    expect(
      grouped.pinnedColumnOffsets[TABLE_GROUP_HIERARCHY_COLUMN_KEY]?.offset,
    ).toBe(0);
    expect(grouped.pinnedColumnOffsets.order_status?.offset).toBeGreaterThan(0);
  });

  it('patches only the derived slices, never the state the user owns', () => {
    // The hierarchy column is a rendering of the grouping configuration, so it
    // must not reach the cookie the layout persists through or the list the
    // settings drawer offers.
    expect(
      Object.keys(patch(['order_status'])).toSorted((a, b) =>
        a.localeCompare(b),
      ),
    ).toStrictEqual([
      'effectiveColumns',
      'normalizedColumns',
      'pinnedColumnOffsets',
      'pinnedColumnPartition',
      'staticKeys',
    ]);
  });
});
