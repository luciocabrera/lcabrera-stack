import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { toGroupKeyColumnOptions } from './toGroupKeyColumnOptions.util';

type TestRow = {
  readonly doc: string;
  readonly order_status: string;
  readonly priority: string;
  readonly total_amount: number;
};

const columns: TableColumn<TestRow>[] = [
  { key: 'order_status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  // Declared `string` on purpose: this is the `numeric` column the presentation
  // vocabulary cannot tell from text (#550). Only the catalogue knows better.
  { key: 'total_amount', label: 'Total' },
  { key: 'doc', label: 'Document' },
];

const capabilities: Readonly<Record<string, TableColumnGroupingCapability>> = {
  doc: {
    aggregates: [],
    canGroup: false,
    column: 'doc',
    refusal: 'not-a-dimension',
    role: 'unsupported',
    typeName: 'jsonb',
  },
  order_status: {
    aggregates: ['count', 'countDistinct'],
    canGroup: true,
    column: 'order_status',
    role: 'dimension',
    typeName: 'text',
  },
  priority: {
    aggregates: ['count', 'countDistinct'],
    canGroup: true,
    column: 'priority',
    role: 'dimension',
    typeName: 'text',
  },
  total_amount: {
    aggregates: ['avg', 'count', 'sum'],
    canGroup: false,
    column: 'total_amount',
    distinctEstimate: 77_567,
    refusal: 'too-many-distinct',
    role: 'fact',
    typeName: 'numeric',
  },
};

describe('toGroupKeyColumnOptions', () => {
  it('leaves out the columns the catalogue refuses as a group key', () => {
    // The defect this closes: both refused columns were offered here, because
    // the filter read only the declared `isGroupable` — which defaults to true.
    expect(
      toGroupKeyColumnOptions({
        capabilities,
        columns,
        stagedKeys: new Set(),
      }),
    ).toStrictEqual([
      { label: 'Status', value: 'order_status' },
      { label: 'Priority', value: 'priority' },
    ]);
  });

  it('leaves out a key already staged', () => {
    expect(
      toGroupKeyColumnOptions({
        capabilities,
        columns,
        stagedKeys: new Set(['order_status']),
      }),
    ).toStrictEqual([{ label: 'Priority', value: 'priority' }]);
  });

  it('offers every declared-groupable column when the route resolved no capabilities', () => {
    // A route may group without shipping a capability map, and reading the
    // empty map as "everything is refused" would switch its drawer off.
    expect(
      toGroupKeyColumnOptions({
        capabilities: {},
        columns,
        stagedKeys: new Set(),
      }),
    ).toStrictEqual([
      { label: 'Status', value: 'order_status' },
      { label: 'Priority', value: 'priority' },
      { label: 'Total', value: 'total_amount' },
      { label: 'Document', value: 'doc' },
    ]);
  });

  it('honours a consumer opt-out the catalogue would have allowed', () => {
    expect(
      toGroupKeyColumnOptions({
        capabilities,
        columns: [{ isGroupable: false, key: 'priority', label: 'Priority' }],
        stagedKeys: new Set(),
      }),
    ).toStrictEqual([]);
  });
});
