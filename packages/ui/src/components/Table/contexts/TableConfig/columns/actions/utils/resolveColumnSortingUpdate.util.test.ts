import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnOrderState,
  ColumnPinningState,
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

import { resolveColumnSortingUpdate } from './resolveColumnSortingUpdate.util';

type Row = {
  readonly priority: string;
  readonly status: string;
  readonly total_amount: number;
};

const columns = [
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
] as TableColumn<Row>[];

type BaseArgsOverrides = {
  readonly aggregates?: readonly TableColumnAggregate[];
  readonly groupingKeys?: readonly string[];
};

/**
 * The declared column list and no grouping — the shape every caller had before
 * measure columns existed. Overridden per test where the two diverge.
 */
const baseArgs = ({
  aggregates = [],
  groupingKeys = [],
}: BaseArgsOverrides = {}) => ({
  aggregates,
  columnOrder: [] as ColumnOrderState<Row>,
  columnPinning: { left: [], right: [] } as ColumnPinningState<Row>,
  columns,
  groupingKeys,
});

describe('resolveColumnSortingUpdate', () => {
  it('returns ignored for the actions column', () => {
    const result = resolveColumnSortingUpdate<Row>({
      ...baseArgs(),
      existingSorting: [],
      sort: { columnKey: 'actions', direction: 'asc' },
    });

    expect(result).toEqual({ kind: 'ignored' });
  });

  it('returns unchanged when the direction matches the current sorting', () => {
    const result = resolveColumnSortingUpdate<Row>({
      ...baseArgs(),
      existingSorting: [{ columnKey: 'status', direction: 'asc' }],
      sort: { columnKey: 'status', direction: 'asc' },
    });

    expect(result).toEqual({ kind: 'unchanged' });
  });

  it('returns updated sorting and a persistence entry when sorting changes', () => {
    const result = resolveColumnSortingUpdate<Row>({
      ...baseArgs(),
      existingSorting: [{ columnKey: 'status', direction: 'asc' }],
      sort: { columnKey: 'priority', direction: 'desc' },
    });

    expect(result).toMatchObject({
      kind: 'updated',
      persistenceEntry: {
        searchParamKey: 'sorting',
        searchParamValue: '{"status":"asc","priority":"desc"}',
      },
      sorting: [
        { columnKey: 'status', direction: 'asc' },
        { columnKey: 'priority', direction: 'desc' },
      ],
    });
  });

  it('keeps the measure columns in the lookup it hands back', () => {
    // The regression (#872 review): this resolved `normalizedColumns` from the
    // **declared** list, which never contains a measure column, so every sort
    // click dropped `total_amount:avg` from the lookup while
    // `pinnedColumnPartition` still asked for it to be rendered.
    const result = resolveColumnSortingUpdate<Row>({
      ...baseArgs({
        aggregates: [
          { columnKey: 'total_amount', fn: 'avg' },
          { columnKey: 'total_amount', fn: 'min' },
        ],
        groupingKeys: ['status'],
      }),
      existingSorting: [],
      sort: { columnKey: 'priority', direction: 'desc' },
    });

    if (result.kind !== 'updated') throw new Error('expected an update');

    // The source column is gone — replaced by its measures, which is what
    // `withAggregateColumns` does — and both measures are addressable.
    expect(Object.keys(result.viewState.normalizedColumns)).toContain(
      'total_amount:avg',
    );
    expect(Object.keys(result.viewState.normalizedColumns)).toContain(
      'total_amount:min',
    );
    expect(Object.keys(result.viewState.normalizedColumns)).not.toContain(
      'total_amount',
    );
  });

  it('records the sort it just applied against a measure column', () => {
    // Sorting a measure is the whole feature; the lookup has to carry the
    // direction or the header renders unsorted right after the click.
    const result = resolveColumnSortingUpdate<Row>({
      ...baseArgs({
        aggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
        groupingKeys: ['status'],
      }),
      existingSorting: [],
      sort: { columnKey: 'total_amount:avg', direction: 'desc' },
    });

    if (result.kind !== 'updated') throw new Error('expected an update');

    expect(
      result.viewState.normalizedColumns['total_amount:avg']?.sortDirection,
    ).toBe('desc');
  });
});
