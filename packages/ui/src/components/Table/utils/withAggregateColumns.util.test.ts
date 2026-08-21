import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnPinningState,
  TableColumn,
  TableColumnAggregate,
} from '../Table.types';

import { withAggregateColumns } from './withAggregateColumns.util';

type Row = {
  readonly customer_type: string;
  readonly order_count: number;
  readonly order_id: number;
  readonly total_amount: number;
};

const columns: readonly TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'order_id', label: 'Order' },
  { key: 'customer_type', label: 'Customer Type' },
  {
    dataType: 'currency',
    format: { currency: { currency: 'USD' } },
    key: 'total_amount',
    label: 'Total Amount',
    minWidth: 160,
  },
  { dataType: 'number', key: 'order_count', label: 'Orders' },
];

const noPinning: ColumnPinningState<Row> = { left: [], right: [] };

type RunArgs = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder?: readonly string[];
  readonly columnPinning?: ColumnPinningState<Row>;
  readonly groupingKeys?: readonly string[];
};

const run = ({
  aggregates,
  columnOrder = ['order_id', 'customer_type', 'total_amount', 'order_count'],
  columnPinning = noPinning,
  groupingKeys = ['customer_type'],
}: RunArgs) =>
  withAggregateColumns<Row>({
    aggregates,
    columnOrder: columnOrder as never,
    columnPinning,
    columns,
    groupingKeys,
  });

const keysOf = (result: ReturnType<typeof run>) =>
  result.columns.map((column) => String(column.key));

type ColumnAtArgs = {
  readonly key: string;
  readonly result: ReturnType<typeof run>;
};

const columnAt = ({ key, result }: ColumnAtArgs) =>
  result.columns.find((column) => String(column.key) === key);

describe('withAggregateColumns', () => {
  it('replaces a measured column with one column per aggregate, in place', () => {
    const result = run({
      aggregates: [
        { columnKey: 'total_amount', fn: 'avg' },
        { columnKey: 'total_amount', fn: 'min' },
      ],
    });

    // In place: the measures sit where `total_amount` sat, not at the end.
    expect(keysOf(result)).toStrictEqual([
      'order_id',
      'customer_type',
      'total_amount:avg',
      'total_amount:min',
      'order_count',
    ]);
    expect(result.columnOrder).toStrictEqual([
      'order_id',
      'customer_type',
      'total_amount:avg',
      'total_amount:min',
      'order_count',
    ]);
  });

  it('follows the staged order of the aggregates within a column', () => {
    const result = run({
      aggregates: [
        { columnKey: 'total_amount', fn: 'min' },
        { columnKey: 'total_amount', fn: 'avg' },
      ],
    });

    expect(keysOf(result)).toStrictEqual([
      'order_id',
      'customer_type',
      'total_amount:min',
      'total_amount:avg',
      'order_count',
    ]);
  });

  it('inherits the source column format and width, and resolves the aggregate data type', () => {
    const result = run({
      aggregates: [
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'count' },
      ],
    });
    const sum = columnAt({ key: 'total_amount:sum', result });
    const count = columnAt({ key: 'total_amount:count', result });

    expect(sum).toMatchObject({
      // A sum of money is money.
      dataType: 'currency',
      format: { currency: { currency: 'USD' } },
      headerGroupLabel: 'Total Amount',
      label: 'Sum',
      minWidth: 160,
    });
    // A tally is never money, whatever it is a tally of.
    expect(count?.dataType).toBe('number');
    expect(count?.label).toBe('Count');
  });

  it('makes a measure sortable but neither filterable nor groupable', () => {
    const measure = columnAt({
      key: 'total_amount:avg',
      result: run({ aggregates: [{ columnKey: 'total_amount', fn: 'avg' }] }),
    });

    expect(measure).toMatchObject({
      isFilterable: false,
      isGroupable: false,
      isSortable: true,
    });
  });

  it('drops an aggregate naming a group key, which carries its key instead', () => {
    const result = run({
      aggregates: [{ columnKey: 'customer_type', fn: 'count' }],
      groupingKeys: ['customer_type'],
    });

    expect(keysOf(result)).toStrictEqual([
      'order_id',
      'customer_type',
      'total_amount',
      'order_count',
    ]);
  });

  it('drops an aggregate naming no declared column', () => {
    const result = run({
      aggregates: [{ columnKey: 'not_a_column', fn: 'sum' }],
    });

    expect(keysOf(result)).toStrictEqual([
      'order_id',
      'customer_type',
      'total_amount',
      'order_count',
    ]);
  });

  it('returns the inputs untouched when nothing is measured', () => {
    const result = run({ aggregates: [] });

    expect(result.columns).toBe(columns);
    expect(result.columnPinning).toBe(noPinning);
  });

  it("inherits the source column's pin side rather than unpinning its measures", () => {
    const result = run({
      aggregates: [
        { columnKey: 'total_amount', fn: 'avg' },
        { columnKey: 'total_amount', fn: 'min' },
      ],
      columnPinning: { left: [], right: ['total_amount'] },
    });

    expect(result.columnPinning.right).toStrictEqual([
      'total_amount:avg',
      'total_amount:min',
    ]);
    expect(result.columnPinning.left).toStrictEqual([]);
  });

  it('measures a primary-key column beside it rather than replacing it', () => {
    // Replacing it would leave no column carrying `isPrimaryKey`, and
    // `resolveCrudRowId` throws a TypeError when none does — taking out the
    // row-actions menu of every row for a grouping settable from the URL.
    const result = run({
      aggregates: [{ columnKey: 'order_id', fn: 'count' }],
    });

    expect(keysOf(result)).toStrictEqual([
      'order_id',
      'order_id:count',
      'customer_type',
      'total_amount',
      'order_count',
    ]);
    expect(result.columns[0]?.isPrimaryKey).toBe(true);
  });

  it('leaves the consumer’s own column list unmutated', () => {
    run({
      aggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
    });

    expect(columns.map((column) => String(column.key))).toStrictEqual([
      'order_id',
      'customer_type',
      'total_amount',
      'order_count',
    ]);
  });
});

describe('a persisted layout that already names a measure column', () => {
  const aggregates: readonly TableColumnAggregate[] = [
    { columnKey: 'total_amount', fn: 'avg' },
    { columnKey: 'total_amount', fn: 'min' },
  ];

  it('does not emit the same column twice in the order', () => {
    // Reachable by pinning a measure before this was fixed, and reachable
    // forever after through a cookie written by an older build: the order
    // names `total_amount:avg` *and* the source column it comes from.
    // `orderColumnsByKeys` resolves both entries to the same column object, so
    // without deduplication two identical `Average` columns render with
    // duplicate React keys.
    const result = run({
      aggregates,
      columnOrder: [
        'total_amount:avg',
        'order_id',
        'customer_type',
        'total_amount',
        'order_count',
      ],
    });

    expect(result.columnOrder).toStrictEqual([
      'total_amount:avg',
      'order_id',
      'customer_type',
      'total_amount:min',
      'order_count',
    ]);
  });

  it('does not emit the same column twice in a pin list', () => {
    const result = run({
      aggregates,
      columnPinning: {
        left: ['total_amount:avg', 'total_amount'] as never,
        right: [],
      },
    });

    expect(result.columnPinning.left).toStrictEqual([
      'total_amount:avg',
      'total_amount:min',
    ]);
  });
});
