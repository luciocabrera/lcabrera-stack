import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnOrderState,
  ColumnPinningState,
  TableColumn,
  TableColumnAggregate,
} from '../Table.types';

import {
  DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH,
  DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH,
} from '../Table.constants';
import { getPinnedDerivedColumnsState } from './getPinnedDerivedColumnsState.util';

type Row = {
  readonly customer_type: string;
  readonly order_id: number;
  readonly total_amount: number;
};

const columns: readonly TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'order_id', label: 'Order' },
  {
    key: 'customer_type',
    label: 'Customer Type',
    maxWidth: 180,
    minWidth: 130,
  },
  {
    dataType: 'currency',
    key: 'total_amount',
    label: 'Total Amount',
    maxWidth: 180,
    minWidth: 130,
  },
  { key: 'actions', label: 'Actions' },
];

const noPinning: ColumnPinningState<Row> = { left: [], right: [] };

type RunArgs = {
  readonly aggregates?: readonly TableColumnAggregate[];
  readonly groupingKeys?: readonly string[];
};

const run = ({
  aggregates = [{ columnKey: 'total_amount', fn: 'sum' }],
  groupingKeys = ['customer_type'],
}: RunArgs = {}) =>
  getPinnedDerivedColumnsState<Row>({
    aggregates,
    columnOrder: [
      'order_id',
      'customer_type',
      'total_amount',
      'actions',
    ] as ColumnOrderState<Row>,
    columnPinning: noPinning,
    columns,
    groupingKeys,
  });

const bandsOf = (state: ReturnType<typeof run>) =>
  state.gridColumns.map(({ maxWidth, minWidth }) => [minWidth, maxWidth]);

const keysOf = (state: ReturnType<typeof run>) =>
  state.gridColumns.map(({ key }) => String(key));

describe('getPinnedDerivedColumnsState while grouping is applied', () => {
  it('paints the group keys and the measures, and no row-actions column', () => {
    expect(keysOf(run())).toStrictEqual(['customer_type', 'total_amount:sum']);
  });

  it('sizes every painted column from the band, not from the declared widths', () => {
    expect(bandsOf(run())).toStrictEqual([
      [DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH, DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH],
      [DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH, DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH],
    ]);
  });

  it('leaves an ungrouped grid its own columns and its own widths', () => {
    const state = run({ aggregates: [], groupingKeys: [] });

    expect({ bands: bandsOf(state), keys: keysOf(state) }).toStrictEqual({
      bands: [
        [undefined, undefined],
        [130, 180],
        [130, 180],
        [undefined, undefined],
      ],
      keys: ['order_id', 'customer_type', 'total_amount', 'actions'],
    });
  });
});

const ungrouped = () => run({ groupingKeys: [] });

describe('getPinnedDerivedColumnsState while a measure is painted ungrouped', () => {
  it('still paints the measure, because removing the last group key keeps the aggregates', () => {
    expect(keysOf(ungrouped())).toStrictEqual([
      'order_id',
      'customer_type',
      'total_amount:sum',
      'actions',
    ]);
  });

  it('bands the measure and leaves every other column its declared widths', () => {
    expect(bandsOf(ungrouped())).toStrictEqual([
      [undefined, undefined],
      [130, 180],
      [DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH, DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH],
      [undefined, undefined],
    ]);
  });
});
