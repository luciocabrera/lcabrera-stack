// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import {
  TableConfigProvider,
  TableDataProvider,
} from '#ui/components/Table/contexts';
import { TableDrawerProvider } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider';
import { groupedColumnAxisFixture } from '#ui/utils/tests/groupedColumnAxisFixture.util';

import { useGetRenderedColumnKeys } from './useGetRenderedColumnKeys.hook';

const Wrapper = ({ children }: { readonly children: ReactNode }) => (
  <TableConfigProvider
    columnsState={{ columns: groupedColumnAxisFixture.columns }}
    groupingState={{
      aggregates: groupedColumnAxisFixture.aggregates,
      columnAxis: groupedColumnAxisFixture.columnAxis,
      keys: groupedColumnAxisFixture.groupingKeys,
    }}
  >
    <TableDataProvider
      dataState={{
        data: groupedColumnAxisFixture.rows,
        isLoading: false,
        isLoadingMore: false,
        totalRows: groupedColumnAxisFixture.rows.length,
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
