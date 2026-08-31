import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnPinningState,
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

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
  readonly columnVisibility?: ReadonlySet<string>;
  readonly groupingKeys?: readonly string[];
};

const run = ({
  aggregates = [],
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
