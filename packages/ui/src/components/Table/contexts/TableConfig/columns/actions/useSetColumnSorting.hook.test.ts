// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { useSetColumnSorting } from './useSetColumnSorting.hook';

type Row = {
  readonly priority: string;
  readonly status: string;
  readonly total_amount: number;
};

const {
  mockColumnsStore,
  mockMetaStore,
  mockPersistTableState,
  mockUsePersistTableStateAction,
  mockUseTableConfigContextValue,
  mockUseTableDataContextValue,
  setAggregates,
  setColumnsState,
  setDrawersSyncNonce,
} = vi.hoisted(() => {
  let columnsState: Record<string, unknown> = {
    columns: [{ key: 'status', label: 'Status' }],
    sorting: [],
  };

  const mockColumnsStore = {
    get: vi.fn(() => columnsState),
    set: vi.fn((value: Record<string, unknown>) => {
      columnsState = { ...columnsState, ...value };
    }),
  };

  let drawersSyncNonce = 0;
  let aggregates: readonly unknown[] = [];
  let groupingKeys: readonly string[] = [];

  const mockMetaStore = {
    get: vi.fn(() => ({ drawersSyncNonce, persistenceKey: 'orders-table' })),
    set: vi.fn((value: { readonly drawersSyncNonce?: number }) => {
      drawersSyncNonce = value.drawersSyncNonce ?? drawersSyncNonce;
    }),
  };

  const mockGroupingStore = {
    get: vi.fn(() => ({ aggregates, keys: groupingKeys })),
  };

  const mockDataStore = { set: vi.fn() };
  const mockPersistTableState = vi.fn();

  return {
    mockColumnsStore,
    mockMetaStore,
    mockPersistTableState,
    mockUsePersistTableStateAction: () => mockPersistTableState,
    mockUseTableConfigContextValue: () => ({
      columnsStore: mockColumnsStore,
      groupingStore: mockGroupingStore,
      metaStore: mockMetaStore,
    }),
    mockUseTableDataContextValue: () => ({ dataStore: mockDataStore }),
    setAggregates: ({
      keys,
      nextAggregates,
    }: {
      readonly keys: readonly string[];
      readonly nextAggregates: readonly TableColumnAggregate[];
    }) => {
      aggregates = nextAggregates;
      groupingKeys = keys;
    },
    setColumnsState: (nextState: Record<string, unknown>) => {
      columnsState = nextState;
    },
    setDrawersSyncNonce: (nextNonce: number) => {
      drawersSyncNonce = nextNonce;
    },
  };
});

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: mockUseTableConfigContextValue,
  }),
);

vi.mock(
  '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook',
  () => ({
    useTableDataContextValue: mockUseTableDataContextValue,
  }),
);

vi.mock('./hooks/usePersistTableStateAction.hook', () => ({
  usePersistTableStateAction: mockUsePersistTableStateAction,
}));

const renderSetColumnSorting = () =>
  renderHook(() => useSetColumnSorting<Row>()).result;

describe('useSetColumnSorting', () => {
  beforeEach(() => {
    setColumnsState({
      columnOrder: ['priority', 'status', 'total_amount'],
      columnPinning: { left: [], right: [] },
      columns: [
        { key: 'priority', label: 'Priority' },
        { key: 'status', label: 'Status' },
        { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
      ],
      sorting: [],
    });
    setAggregates({ keys: [], nextAggregates: [] });
    setDrawersSyncNonce(0);
    mockColumnsStore.set.mockClear();
    mockMetaStore.set.mockClear();
    mockPersistTableState.mockReset();
    mockPersistTableState.mockReturnValue(true);
  });

  it('reads the latest sorting state on every invocation', () => {
    const result = renderSetColumnSorting();

    act(() => {
      result.current({ columnKey: 'status', direction: 'asc' });
    });

    act(() => {
      result.current({ columnKey: 'priority', direction: 'desc' });
    });

    expect(mockPersistTableState).toHaveBeenLastCalledWith({
      searchParamKey: 'sorting',
      searchParamValue: '{"status":"asc","priority":"desc"}',
    });
    expect(mockMetaStore.set).toHaveBeenCalledWith({ drawersSyncNonce: 2 });
  });

  it('writes a lookup that still holds the measure columns', () => {
    setAggregates({
      keys: ['status'],
      nextAggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
    });

    const result = renderSetColumnSorting();

    act(() => {
      result.current({ columnKey: 'total_amount:avg', direction: 'desc' });
    });

    const written = mockColumnsStore.set.mock.calls.at(-1)?.[0] as {
      readonly normalizedColumns: Record<string, unknown>;
      readonly pinnedColumnPartition: Record<
        string,
        readonly { readonly key: string }[]
      >;
    };

    const painted = Object.values(written.pinnedColumnPartition)
      .flat()
      .map((column) => String(column.key));

    expect(painted).toContain('total_amount:avg');
    expect(
      painted.filter(
        (columnKey) => !Object.hasOwn(written.normalizedColumns, columnKey),
      ),
    ).toStrictEqual([]);
  });
});
