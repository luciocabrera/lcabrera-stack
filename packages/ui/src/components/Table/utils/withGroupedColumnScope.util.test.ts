import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnPinningState,
  TableColumn,
  TableColumnAggregate,
} from '../Table.types';

import { withGroupedColumnScope } from './withGroupedColumnScope.util';

type Row = {
  readonly amount: number;
  readonly id: number;
  readonly region: string;
  readonly shipped_at: string;
};

const columns: readonly TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'region', label: 'Region' },
  { dataType: 'number', key: 'amount', label: 'Amount' },
  { dataType: 'date', key: 'shipped_at', label: 'Shipped At' },
];

const noPinning: ColumnPinningState<Row> = { left: [], right: [] };

type RunArgs = {
  readonly aggregates?: readonly TableColumnAggregate[];
  readonly columns?: readonly TableColumn<Row>[];
  readonly groupingKeys?: readonly string[];
};

const run = ({
  aggregates = [],
  columns: given = columns,
  groupingKeys = ['region'],
}: RunArgs = {}) =>
  withGroupedColumnScope<Row>({
    aggregates,
    columnOrder: ['id', 'region', 'amount', 'shipped_at'] as never,
    columnPinning: noPinning,
    columns: given,
    columnVisibility: new Set() as never,
    groupingKeys,
  });

const keysOf = (result: ReturnType<typeof run>) =>
  result.columns.map((column) => String(column.key));

describe('withGroupedColumnScope', () => {
  it('keeps the group keys and the measures, and drops the rest', () => {
    const result = run({
      aggregates: [
        { columnKey: 'amount', fn: 'sum' },
        { columnKey: 'amount', fn: 'avg' },
      ],
      columns: [
        ...columns,
        { key: 'amount:sum', label: 'Sum' },
        { key: 'amount:avg', label: 'Average' },
      ],
    });

    expect(keysOf(result)).toStrictEqual([
      'region',
      'amount:sum',
      'amount:avg',
    ]);
  });

  it('keeps the row-actions column, which carries no field of the row', () => {
    const result = run({
      columns: [...columns, { key: 'actions', label: 'Actions' }],
    });

    expect(keysOf(result)).toStrictEqual(['region', 'actions']);
  });

  it('changes nothing while no grouping is applied', () => {
    const result = run({ groupingKeys: [] });

    expect(result.columns).toBe(columns);
  });

  it('changes nothing when every applied key is undeclared', () => {
    // Grouping configuration is URL state, so it can name a column this route
    // never declared. Scoping to it would paint an empty grid.
    const result = run({ groupingKeys: ['not_a_column'] });

    expect(result.columns).toBe(columns);
  });

  it('leaves the order, pinning and visibility it was handed untouched', () => {
    const columnVisibility = new Set(['amount']) as never;
    const columnOrder = ['id', 'region'] as never;
    const result = withGroupedColumnScope<Row>({
      aggregates: [],
      columnOrder,
      columnPinning: noPinning,
      columns,
      columnVisibility,
      groupingKeys: ['region'],
    });

    expect(result.columnOrder).toBe(columnOrder);
    expect(result.columnPinning).toBe(noPinning);
    expect(result.columnVisibility).toBe(columnVisibility);
  });

  it('leaves the consumer’s own column list unmutated', () => {
    run({ aggregates: [{ columnKey: 'amount', fn: 'sum' }] });

    expect(columns.map((column) => String(column.key))).toStrictEqual([
      'id',
      'region',
      'amount',
      'shipped_at',
    ]);
  });
});
