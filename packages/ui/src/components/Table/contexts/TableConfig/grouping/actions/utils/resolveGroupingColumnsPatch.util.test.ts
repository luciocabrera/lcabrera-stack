import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnAggregate,
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

type PatchArgs = {
  readonly aggregates?: readonly TableColumnAggregate[];
  readonly groupingKeys: readonly string[];
};

const patch = ({ aggregates = [], groupingKeys }: PatchArgs) =>
  resolveGroupingColumnsPatch<Row>({ aggregates, columnsState, groupingKeys });

const measureAmount: readonly TableColumnAggregate[] = [
  { columnKey: 'total_amount', fn: 'sum' },
];

describe('resolveGroupingColumnsPatch', () => {
  it('hoists the group keys to the head of the painted grid, in key order', () => {
    // Ahead of the measure over `total_amount`, which the user both ordered
    // first and pinned left. The keys land at indices 0…N-1 whatever the saved
    // layout says.
    expect(
      patch({
        aggregates: measureAmount,
        groupingKeys: ['ship_country', 'order_status'],
      }).effectiveColumns.map((col) => col.key),
    ).toStrictEqual(['ship_country', 'order_status', 'total_amount:sum']);
  });

  it('paints the columns the grouping names and no others', () => {
    // A column the grouping neither keys nor measures carries nothing on a
    // group row, so it is not painted at all (ADR-095).
    expect(
      patch({ groupingKeys: ['order_status'] }).effectiveColumns.map((col) =>
        String(col.key),
      ),
    ).toStrictEqual(['order_status']);
  });

  it('leaves no column between two group keys', () => {
    const keys = patch({
      aggregates: measureAmount,
      groupingKeys: ['ship_country', 'order_status'],
    })
      .effectiveColumns.map((col) => String(col.key))
      .filter((key) => key !== 'total_amount:sum');

    expect(keys).toStrictEqual(['ship_country', 'order_status']);
  });

  it('restores the user layout exactly when grouping goes off', () => {
    expect(
      patch({ groupingKeys: [] }).pinnedColumnPartition.leftPinnedCols.map(
        (col) => col.key,
      ),
    ).toStrictEqual(['total_amount']);
    expect(
      patch({ groupingKeys: [] }).effectiveColumns.map((col) => col.key),
    ).toStrictEqual(['total_amount', 'order_status', 'ship_country']);
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
      Object.keys(patch({ groupingKeys: ['order_status'] })).toSorted((a, b) =>
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

  it('keeps the sort of a hidden column while dropping one the grid lost', () => {
    // Two claims in one state, because either alone passes a defect. Pruning
    // against `effectiveColumns` — which `getEffectiveColumns` filters by
    // visibility first — drops the hidden column's sort, and pruning against
    // nothing keeps the measure's.
    const hiddenAndMeasured = getInitialColumnsState<Row>({
      aggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
      columns,
      columnVisibility: new Set(['ship_country']),
      groupingKeys: ['order_status'],
      sorting: [
        { columnKey: 'ship_country', direction: 'asc' },
        { columnKey: 'total_amount:avg', direction: 'desc' },
      ],
    }) as TableColumnsState<Row>;

    const next = resolveGroupingColumnsPatch<Row>({
      // Grouping cleared: the measure column goes with it, the hidden one stays.
      aggregates: [],
      columnsState: hiddenAndMeasured,
      groupingKeys: [],
    });

    expect(next.sorting).toStrictEqual([
      { columnKey: 'ship_country', direction: 'asc' },
    ]);
  });
  it('keeps the sort of a column an aggregate replaced in the grid', () => {
    // The data-loss case: sort by `Amount`, *then* group with `avg(Amount)`.
    // `withAggregateColumns` replaces the measured column, so the painted list
    // loses `total_amount` — but it is still an ordinary column the read orders
    // by fine. Pruning against the grid alone dropped the sort here, and the
    // caller writes the pruned value into the `sorting` search param, so it was
    // gone from the URL and did not return on ungrouping.
    //
    // Asserted at the call site rather than only on the util, because the
    // util cannot see which lists the caller hands it — the defect was in the
    // argument, not the algorithm.
    const sortedByMeasuredColumn = getInitialColumnsState<Row>({
      columns,
      sorting: [{ columnKey: 'total_amount', direction: 'desc' }],
    }) as TableColumnsState<Row>;

    const next = resolveGroupingColumnsPatch<Row>({
      aggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
      columnsState: sortedByMeasuredColumn,
      groupingKeys: ['order_status'],
    });

    expect(next.sorting).toStrictEqual([
      { columnKey: 'total_amount', direction: 'desc' },
    ]);
  });
});
