import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnPinningState,
  TableColumn,
  TableColumnAggregate,
} from '../Table.types';

import {
  DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH,
  DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH,
} from '../Table.constants';
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
  readonly columnAxis?: {
    readonly emitted: readonly {
      readonly alias: string;
      readonly axis?: { readonly value: unknown };
      readonly columnKey: string;
      readonly fn: TableColumnAggregate['fn'];
    }[];
  };
  readonly columnOrder?: readonly string[];
  readonly columnPinning?: ColumnPinningState<Row>;
  readonly columns?: readonly TableColumn<Row>[];
  readonly columnVisibility?: ReadonlySet<string>;
  readonly groupingKeys?: readonly string[];
};

const run = ({
  aggregates,
  columnAxis,
  columnOrder = ['order_id', 'customer_type', 'total_amount', 'order_count'],
  columnPinning = noPinning,
  columns: runColumns = columns,
  columnVisibility = new Set<string>(),
  groupingKeys = ['customer_type'],
}: RunArgs) =>
  withAggregateColumns<Row>({
    aggregates,
    columnOrder: columnOrder as never,
    columnPinning,
    columns: runColumns,
    columnVisibility: columnVisibility as never,
    groupingKeys,
    ...(columnAxis !== undefined && { columnAxis }),
  });

const withTotalAmount = (patch: Partial<TableColumn<Row>>) =>
  columns.map((column) =>
    column.key === 'total_amount' ? { ...column, ...patch } : column,
  );

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

  it('inherits the source column format, and resolves the aggregate data type', () => {
    const result = run({
      aggregates: [
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'count' },
      ],
    });
    const sum = columnAt({ key: 'total_amount:sum', result });
    const count = columnAt({ key: 'total_amount:count', result });

    expect(sum).toMatchObject({
      dataType: 'currency',
      format: { currency: { currency: 'USD' } },
      headerGroupLabel: 'Total Amount',
      label: 'Sum',
    });
    expect(count?.dataType).toBe('number');
    expect(count?.label).toBe('Count');
  });

  it('takes the band rather than the widths its source declared', () => {
    const result = run({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      columns: withTotalAmount({ maxWidth: 120, minWidth: 90 }),
    });
    const measure = columnAt({ key: 'total_amount:sum', result });

    expect({
      maxWidth: measure?.maxWidth,
      minWidth: measure?.minWidth,
    }).toStrictEqual({
      maxWidth: DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH,
      minWidth: DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH,
    });
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

  it('replaces a measured primary-key column like any other', () => {
    const result = run({
      aggregates: [{ columnKey: 'order_id', fn: 'count' }],
    });

    expect(keysOf(result)).toStrictEqual([
      'order_id:count',
      'customer_type',
      'total_amount',
      'order_count',
    ]);
    expect(result.columns.some((column) => column.isPrimaryKey === true)).toBe(
      false,
    );
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

describe('hiding a measured column', () => {
  const aggregates: readonly TableColumnAggregate[] = [
    { columnKey: 'total_amount', fn: 'avg' },
    { columnKey: 'total_amount', fn: 'min' },
  ];

  it('hides the measures that replaced it', () => {
    const result = run({
      aggregates,
      columnVisibility: new Set(['total_amount']),
    });

    expect([...result.columnVisibility]).toStrictEqual([
      'total_amount:avg',
      'total_amount:min',
    ]);
  });

  it('leaves a directly-hidden measure hidden', () => {
    const result = run({
      aggregates,
      columnVisibility: new Set(['total_amount:avg']),
    });

    expect([...result.columnVisibility]).toStrictEqual(['total_amount:avg']);
  });

  it('leaves an unrelated hidden column alone', () => {
    const result = run({
      aggregates,
      columnVisibility: new Set(['order_count']),
    });

    expect([...result.columnVisibility]).toStrictEqual(['order_count']);
  });
});

describe('a measured column the consumer locked', () => {
  const lockedColumns: readonly TableColumn<Row>[] = [
    { key: 'customer_type', label: 'Customer Type' },
    {
      isResizable: false,
      isStatic: true,
      key: 'total_amount',
      label: 'Total Amount',
    },
  ];

  const measureOfLocked = () =>
    withAggregateColumns<Row>({
      aggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
      columnOrder: ['customer_type', 'total_amount'] as never,
      columnPinning: noPinning,
      columns: lockedColumns,
      columnVisibility: new Set<string>() as never,
      groupingKeys: ['customer_type'],
    }).columns.find(({ key }) => String(key) === 'total_amount:avg');

  it('carries the lock onto the measure that replaced it', () => {
    expect(measureOfLocked()).toMatchObject({
      isResizable: false,
      isStatic: true,
    });
  });

  it('still describes the measure’s own data, not the source’s', () => {
    expect(measureOfLocked()).toMatchObject({
      isFilterable: false,
      isGroupable: false,
      isSortable: true,
    });
  });
});

describe('a column axis', () => {
  const emitted = [
    {
      alias: 'sum_total_amount_c0',
      axis: { value: 'Pending' },
      columnKey: 'total_amount',
      fn: 'sum' as const,
    },
    {
      alias: 'sum_total_amount_c1',
      axis: { value: undefined },
      columnKey: 'total_amount',
      fn: 'sum' as const,
    },
  ];

  it('uses the emitted alias as the column key and the axis value as the header', () => {
    const result = run({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      columnAxis: { emitted },
    });

    expect(keysOf(result)).toStrictEqual([
      'order_id',
      'customer_type',
      'sum_total_amount_c0',
      'sum_total_amount_c1',
      'order_count',
    ]);
    expect(columnAt({ key: 'sum_total_amount_c0', result })?.label).toBe(
      'Pending',
    );
  });

  it('renders SQL NULL as an empty header', () => {
    const result = run({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      columnAxis: { emitted },
    });

    expect(columnAt({ key: 'sum_total_amount_c1', result })?.label).toBe('');
  });

  it('emits no measure columns when the axis is empty', () => {
    const result = run({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      columnAxis: { emitted: [] },
    });

    expect(keysOf(result)).toStrictEqual([
      'order_id',
      'customer_type',
      'order_count',
    ]);
  });

  it('bands several measures under one axis value', () => {
    const result = run({
      aggregates: [
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'avg' },
      ],
      columnAxis: {
        emitted: [
          {
            alias: 'sum_total_amount_c0',
            axis: { value: 'Pending' },
            columnKey: 'total_amount',
            fn: 'sum',
          },
          {
            alias: 'avg_total_amount_c0',
            axis: { value: 'Pending' },
            columnKey: 'total_amount',
            fn: 'avg',
          },
        ],
      },
    });

    expect(columnAt({ key: 'sum_total_amount_c0', result })).toMatchObject({
      headerGroupLabel: 'Pending',
      label: 'Sum',
    });
    expect(columnAt({ key: 'avg_total_amount_c0', result })).toMatchObject({
      headerGroupLabel: 'Pending',
      label: 'Average',
    });
  });
});
