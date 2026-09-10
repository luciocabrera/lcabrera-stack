import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { toGroupKeyColumnOptions } from './toGroupKeyColumnOptions.util';

type TestRow = {
  readonly doc: string;
  readonly order_status: string;
  readonly ordered_at: string;
  readonly priority: string;
  readonly total_amount: number;
};

const columns: TableColumn<TestRow>[] = [
  { key: 'order_status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'ordered_at', label: 'Ordered at' },
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
    periods: [],
    refusal: 'not-a-dimension',
    role: 'unsupported',
    typeName: 'jsonb',
  },
  order_status: {
    aggregates: ['count', 'countDistinct'],
    canGroup: true,
    column: 'order_status',
    periods: [],
    role: 'dimension',
    typeName: 'text',
  },
  ordered_at: {
    aggregates: ['count', 'countDistinct', 'max', 'min'],
    canGroup: false,
    column: 'ordered_at',
    periods: ['day', 'month'],
    refusal: 'too-many-distinct',
    role: 'dimension',
    typeName: 'timestamptz',
  },
  priority: {
    aggregates: ['count', 'countDistinct'],
    canGroup: true,
    column: 'priority',
    periods: [],
    role: 'dimension',
    typeName: 'text',
  },
  total_amount: {
    aggregates: ['avg', 'count', 'sum'],
    canGroup: false,
    column: 'total_amount',
    distinctEstimate: 77_567,
    periods: [],
    refusal: 'too-many-distinct',
    role: 'fact',
    typeName: 'numeric',
  },
};

describe('toGroupKeyColumnOptions', () => {
  it('leaves out the columns the catalogue refuses as a group key', () => {
    expect(
      toGroupKeyColumnOptions({
        capabilities,
        columns,
        stagedKeys: new Set(),
      }),
    ).toStrictEqual([
      { label: 'Status', value: 'order_status' },
      { label: 'Priority', value: 'priority' },
      { label: 'Ordered at', value: 'ordered_at' },
    ]);
  });

  it('leaves out a truncated-only column when the caller cannot apply a period', () => {
    expect(
      toGroupKeyColumnOptions({
        allowRequiredPeriod: false,
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
    ).toStrictEqual([
      { label: 'Priority', value: 'priority' },
      { label: 'Ordered at', value: 'ordered_at' },
    ]);
  });

  it('offers every declared-groupable column when the route resolved no capabilities', () => {
    expect(
      toGroupKeyColumnOptions({
        capabilities: {},
        columns,
        stagedKeys: new Set(),
      }),
    ).toStrictEqual([
      { label: 'Status', value: 'order_status' },
      { label: 'Priority', value: 'priority' },
      { label: 'Ordered at', value: 'ordered_at' },
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
