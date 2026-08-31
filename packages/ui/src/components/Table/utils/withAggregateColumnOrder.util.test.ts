import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnPinningState,
  TableColumn,
  TableColumnAggregate,
} from '../Table.types';

import { withAggregateColumnOrder } from './withAggregateColumnOrder.util';

type Row = {
  readonly amount: number;
  readonly id: number;
  readonly region: string;
};

const declared: readonly TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'region', label: 'Region' },
  { dataType: 'number', key: 'amount', label: 'Amount' },
];

const measures: readonly TableColumn<Row>[] = [
  { key: 'id:count', label: 'Count' },
  { key: 'amount:min', label: 'Minimum' },
  { key: 'amount:max', label: 'Maximum' },
  { key: 'amount:sum', label: 'Sum' },
];

const scoped: readonly TableColumn<Row>[] = [
  { key: 'region', label: 'Region' },
  ...measures,
];

const noPinning: ColumnPinningState<Row> = { left: [], right: [] };

type RunArgs = {
  readonly aggregates?: readonly TableColumnAggregate[];
  readonly columnOrder?: readonly string[];
  readonly columns?: readonly TableColumn<Row>[];
  readonly groupingKeys?: readonly string[];
};

const run = ({
  aggregates = [],
  columnOrder = [
    'region',
    'id:count',
    'amount:min',
    'amount:max',
    'amount:sum',
  ],
  columns = scoped,
  groupingKeys = ['region'],
}: RunArgs = {}) =>
  withAggregateColumnOrder<Row>({
    aggregates,
    columnOrder: columnOrder as never,
    columnPinning: noPinning,
    columns,
    columnVisibility: new Set() as never,
    groupingKeys,
  });

const staged: readonly TableColumnAggregate[] = [
  { columnKey: 'amount', fn: 'min' },
  { columnKey: 'amount', fn: 'max' },
  { columnKey: 'amount', fn: 'sum' },
  { columnKey: 'id', fn: 'count' },
];

const keysOf = (result: ReturnType<typeof run>) =>
  result.columns.map((column) => String(column.key));

describe('withAggregateColumnOrder', () => {
  it('ranks each measured column by its first entry in the staged list', () => {
    const result = run({ aggregates: staged });

    expect(keysOf(result)).toStrictEqual([
      'region',
      'amount:min',
      'amount:max',
      'amount:sum',
      'id:count',
    ]);
  });

  it('orders the column order the same way', () => {
    const result = run({ aggregates: staged });

    expect(result.columnOrder.map(String)).toStrictEqual([
      'region',
      'amount:min',
      'amount:max',
      'amount:sum',
      'id:count',
    ]);
  });

  it('keeps a column’s measures contiguous when the staged list interleaves two', () => {
    const result = run({
      aggregates: [
        { columnKey: 'amount', fn: 'min' },
        { columnKey: 'id', fn: 'count' },
        { columnKey: 'amount', fn: 'max' },
        { columnKey: 'amount', fn: 'sum' },
      ],
    });

    expect(keysOf(result)).toStrictEqual([
      'region',
      'amount:min',
      'amount:max',
      'amount:sum',
      'id:count',
    ]);
  });

  it('leaves the non-measure columns where they were', () => {
    const result = run({
      aggregates: staged,
      columnOrder: [
        'id:count',
        'amount:min',
        'amount:max',
        'amount:sum',
        'region',
      ],
      columns: [...measures, { key: 'region', label: 'Region' }],
    });

    expect(keysOf(result)).toStrictEqual([
      'amount:min',
      'amount:max',
      'amount:sum',
      'id:count',
      'region',
    ]);
  });

  it('returns the inputs untouched when no grouping is applied', () => {
    const columns = [...declared, ...measures];
    const result = run({ aggregates: staged, columns, groupingKeys: [] });

    expect(result.columns).toBe(columns);
  });

  it('returns the inputs untouched when the grouping names no declared column', () => {
    const result = run({ aggregates: staged, groupingKeys: ['not_a_column'] });

    expect(result.columns).toBe(scoped);
  });

  it('returns the inputs untouched when nothing is measured', () => {
    const result = run();

    expect(result.columns).toBe(scoped);
  });

  it('ignores a staged aggregate that no column carries', () => {
    const result = run({
      aggregates: [{ columnKey: 'region', fn: 'count' }, ...staged],
    });

    expect(keysOf(result)).toStrictEqual([
      'region',
      'amount:min',
      'amount:max',
      'amount:sum',
      'id:count',
    ]);
  });

  it('passes pinning and visibility through untouched', () => {
    const result = run({ aggregates: staged });

    expect(result.columnPinning).toBe(noPinning);
    expect(result.columnVisibility.size).toBe(0);
  });

  it('leaves the consumer’s own column list unmutated', () => {
    const columns = [...scoped];

    run({ aggregates: staged, columns });

    expect(columns.map((column) => String(column.key))).toStrictEqual([
      'region',
      'id:count',
      'amount:min',
      'amount:max',
      'amount:sum',
    ]);
  });
});
