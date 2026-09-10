import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnPinningState,
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';
import type { ColumnAxisEmittedAggregate } from '#ui/components/Table/utils/columnAxisEmitted.types';

import { resolveRenderedColumnKeys } from './resolveRenderedColumnKeys.util';

type Row = {
  readonly amount: number;
  readonly id: number;
  readonly region: string;
};

const columns: readonly TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { dataType: 'number', key: 'amount', label: 'Amount' },
  { key: 'region', label: 'Region' },
];

const noPinning: ColumnPinningState<Row> = { left: [], right: [] };

type RunArgs = {
  readonly aggregates?: readonly TableColumnAggregate[];
  readonly columnAxis?: string;
  readonly columnAxisEmitted?: readonly ColumnAxisEmittedAggregate[];
  readonly columnVisibility?: ReadonlySet<string>;
  readonly groupingKeys?: readonly string[];
};

const run = ({
  aggregates = [],
  columnAxis,
  columnAxisEmitted,
  columnVisibility = new Set<string>(),
  groupingKeys = [],
}: RunArgs = {}) =>
  resolveRenderedColumnKeys<Row>({
    aggregates,
    columnOrder: ['id', 'amount', 'region'] as never,
    columnPinning: noPinning,
    columns,
    columnVisibility: columnVisibility as never,
    groupingKeys,
    ...(columnAxis !== undefined && { columnAxis }),
    ...(columnAxisEmitted !== undefined && { columnAxisEmitted }),
  });

describe('resolveRenderedColumnKeys', () => {
  it('answers the group keys then the measures while grouping is applied', () => {
    expect(
      run({
        aggregates: [{ columnKey: 'amount', fn: 'sum' }],
        groupingKeys: ['region'],
      }),
    ).toStrictEqual(['region', 'amount']);
  });

  it('reads a measure as the column it measures', () => {
    expect(
      run({
        aggregates: [
          { columnKey: 'amount', fn: 'sum' },
          { columnKey: 'amount', fn: 'avg' },
        ],
        groupingKeys: ['region'],
      }),
    ).toStrictEqual(['region', 'amount']);
  });

  it('answers the declared visible columns, in order, while ungrouped', () => {
    expect(run({ columnVisibility: new Set(['amount']) })).toStrictEqual([
      'id',
      'region',
    ]);
  });

  it('drops a column the grouping neither keys nor measures', () => {
    expect(run({ groupingKeys: ['region'] })).toStrictEqual(['region']);
  });
});

describe('the drawer listing and the grid agree about measure order', () => {
  it('follows the staged aggregate order rather than the declared one', () => {
    expect(
      run({
        aggregates: [
          { columnKey: 'amount', fn: 'sum' },
          { columnKey: 'id', fn: 'count' },
        ],
        groupingKeys: ['region'],
      }),
    ).toStrictEqual(['region', 'amount', 'id']);
  });

  it('moves with the staged order when the two aggregates swap', () => {
    expect(
      run({
        aggregates: [
          { columnKey: 'id', fn: 'count' },
          { columnKey: 'amount', fn: 'sum' },
        ],
        groupingKeys: ['region'],
      }),
    ).toStrictEqual(['region', 'id', 'amount']);
  });
});

describe('a column axis listing', () => {
  it('names the emitted aliases rather than the unexpanded measure', () => {
    expect(
      run({
        aggregates: [{ columnKey: 'amount', fn: 'sum' }],
        columnAxis: 'status',
        columnAxisEmitted: [
          {
            alias: 'sum_amount_c0',
            axis: { value: 'Pending' },
            columnKey: 'amount',
            fn: 'sum',
          },
          {
            alias: 'sum_amount_c1',
            axis: { value: 'Shipped' },
            columnKey: 'amount',
            fn: 'sum',
          },
        ],
        groupingKeys: ['region'],
      }),
    ).toStrictEqual(['region', 'sum_amount_c0', 'sum_amount_c1']);
  });

  it('drops the measure when the axis has no emitted aliases yet', () => {
    expect(
      run({
        aggregates: [{ columnKey: 'amount', fn: 'sum' }],
        columnAxis: 'status',
        columnAxisEmitted: [],
        groupingKeys: ['region'],
      }),
    ).toStrictEqual(['region']);
  });
});
