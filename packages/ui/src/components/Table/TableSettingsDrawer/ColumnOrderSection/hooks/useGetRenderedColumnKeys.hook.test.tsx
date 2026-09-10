// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import {
  TableConfigProvider,
  TableDataProvider,
} from '#ui/components/Table/contexts';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { TableDrawerProvider } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider';

import { useGetRenderedColumnKeys } from './useGetRenderedColumnKeys.hook';

type Row = Record<string, unknown>;

const columns: TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'customer_type', label: 'Customer Type' },
  { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
  { key: 'order_status', label: 'Status' },
];

const rows: readonly Row[] = [
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [
        {
          alias: 'sum_total_amount_c0',
          axis: { value: 'Pending' },
          columnKey: 'total_amount',
          fn: 'sum',
          value: '100',
        },
        {
          alias: 'sum_total_amount_c1',
          axis: { value: 'Shipped' },
          columnKey: 'total_amount',
          fn: 'sum',
          value: '250',
        },
      ],
      count: 4,
      isSubtotal: false,
      path: [
        {
          columnKey: 'customer_type',
          label: 'Business',
          value: 'Business',
        },
      ],
    },
  },
];

const Wrapper = ({ children }: { readonly children: ReactNode }) => (
  <TableConfigProvider<Row>
    columnsState={{ columns }}
    groupingState={{
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      columnAxis: 'order_status',
      keys: ['customer_type'],
    }}
  >
    <TableDataProvider<Row>
      dataState={{
        data: rows,
        isLoading: false,
        isLoadingMore: false,
        totalRows: rows.length,
      }}
    >
      <TableDrawerProvider>{children}</TableDrawerProvider>
    </TableDataProvider>
  </TableConfigProvider>
);

describe('useGetRenderedColumnKeys', () => {
  it('lists the emitted axis aliases, not the unexpanded measure', () => {
    const { result } = renderHook(() => useGetRenderedColumnKeys(), {
      wrapper: Wrapper,
    });

    expect(result.current).toStrictEqual([
      'customer_type',
      'sum_total_amount_c0',
      'sum_total_amount_c1',
    ]);
  });
});
