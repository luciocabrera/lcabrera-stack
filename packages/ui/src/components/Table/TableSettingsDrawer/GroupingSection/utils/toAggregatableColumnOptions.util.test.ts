import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { toAggregatableColumnOptions } from './toAggregatableColumnOptions.util';

type TestRow = {
  readonly doc: string;
  readonly order_status: string;
  readonly total_amount: number;
};

const columns: TableColumn<TestRow>[] = [
  { dataType: 'string', key: 'order_status', label: 'Status' },
  // Declared `string` on purpose: this is the `numeric` column #550 found the
  // presentation vocabulary reporting as text. Only the catalogue knows better.
  { dataType: 'string', key: 'total_amount', label: 'Total' },
  { dataType: 'string', key: 'doc', label: 'Document' },
];

const capabilities: Readonly<Record<string, TableColumnGroupingCapability>> = {
  doc: {
    aggregates: [],
    canGroup: false,
    periods: [],
    column: 'doc',
    refusal: 'not-a-dimension',
    role: 'unsupported',
    typeName: 'jsonb',
  },
  order_status: {
    aggregates: ['count', 'countDistinct'],
    canGroup: true,
    periods: [],
    column: 'order_status',
    role: 'dimension',
    typeName: 'text',
  },
  total_amount: {
    aggregates: ['avg', 'count', 'sum'],
    canGroup: false,
    periods: [],
    column: 'total_amount',
    refusal: 'too-many-distinct',
    role: 'fact',
    typeName: 'numeric',
  },
};

describe('toAggregatableColumnOptions', () => {
  it('offers the columns the catalogue has aggregates for', () => {
    expect(
      toAggregatableColumnOptions({ capabilities, columns, groupingKeys: [] }),
    ).toStrictEqual([
      { label: 'Status', value: 'order_status' },
      { label: 'Total', value: 'total_amount' },
    ]);
  });

  it('offers a column the catalogue refuses as a *key* but can aggregate', () => {
    // The two gates are independent: a high-cardinality numeric is a bad group
    // key and a perfectly good thing to sum.
    expect(
      toAggregatableColumnOptions({
        capabilities,
        columns,
        groupingKeys: [],
      }).map(({ value }) => value),
    ).toContain('total_amount');
  });

  it('omits a column the catalogue offers nothing for', () => {
    expect(
      toAggregatableColumnOptions({
        capabilities,
        columns,
        groupingKeys: [],
      }).map(({ value }) => value),
    ).not.toContain('doc');
  });

  it('omits every column when no capability was resolved', () => {
    // Absent means "nothing is legal here", never "everything is".
    expect(
      toAggregatableColumnOptions({
        capabilities: {},
        columns,
        groupingKeys: [],
      }),
    ).toStrictEqual([]);
  });

  it('does not offer a column that is already a group key', () => {
    // Under one column per key that column renders its key's value, so an
    // aggregate selected on it could never be shown (ADR-080).
    expect(
      toAggregatableColumnOptions({
        capabilities,
        columns,
        groupingKeys: ['order_status'],
      }).map(({ value }) => value),
    ).toStrictEqual(['total_amount']);
  });
});
