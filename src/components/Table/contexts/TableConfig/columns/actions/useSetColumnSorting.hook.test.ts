// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSetColumnSorting } from './useSetColumnSorting.hook';

const {
  mockGetNormalizedColumns,
  mockPersistTableState,
  mockSerializeSortingToURL,
  mockUsePersistTableStateAction,
  mockUseTableConfigContextValue,
  mockUseTableDataContextValue,
  setColumnsState,
} = vi.hoisted(() => {
  let columnsState = {
    columns: [{ key: 'status', label: 'Status' }],
    sorting: [],
  };

  const mockColumnsStore = {
    get: vi.fn(() => columnsState),
    set: vi.fn((value: Record<string, unknown>) => {
      columnsState = { ...columnsState, ...value };
    }),
  };

  const mockMetaStore = {
    get: vi.fn(() => ({ persistenceKey: 'orders-table' })),
  };

  const mockDataStore = {
    set: vi.fn(),
  };

  const mockPersistTableState = vi.fn();
  const mockSerializeSortingToURL = vi.fn((sorting) => JSON.stringify(sorting));
  const mockGetNormalizedColumns = vi.fn(() => ({}));

  return {
    mockGetNormalizedColumns,
    mockPersistTableState,
    mockSerializeSortingToURL,
    mockUsePersistTableStateAction: () => mockPersistTableState,
    mockUseTableConfigContextValue: () => ({
      columnsStore: mockColumnsStore,
      metaStore: mockMetaStore,
    }),
    mockUseTableDataContextValue: () => ({ dataStore: mockDataStore }),
    setColumnsState: (nextState: typeof columnsState) => {
      columnsState = nextState;
    },
  };
});

vi.mock(
  '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: mockUseTableConfigContextValue,
  }),
);

vi.mock(
  '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook',
  () => ({
    useTableDataContextValue: mockUseTableDataContextValue,
  }),
);

vi.mock('@/components/Table/hooks', () => ({
  usePersistTableStateAction: mockUsePersistTableStateAction,
}));

vi.mock('@/components/Table/utils', () => ({
  getNormalizedColumns: mockGetNormalizedColumns,
}));

vi.mock('@/utils/urlState', () => ({
  serializeSortingToURL: mockSerializeSortingToURL,
}));

describe('useSetColumnSorting', () => {
  beforeEach(() => {
    setColumnsState({
      columns: [
        { key: 'priority', label: 'Priority' },
        { key: 'status', label: 'Status' },
      ],
      sorting: [],
    });
    mockPersistTableState.mockReset();
    mockSerializeSortingToURL.mockClear();
    mockGetNormalizedColumns.mockClear();
  });

  it('reads the latest sorting state on every invocation', () => {
    const { result } = renderHook(() =>
      useSetColumnSorting<{
        readonly priority: string;
        readonly status: string;
      }>(),
    );

    act(() => {
      result.current({
        columnKey: 'status',
        direction: 'asc',
      });
    });

    act(() => {
      result.current({
        columnKey: 'priority',
        direction: 'desc',
      });
    });

    expect(mockPersistTableState).toHaveBeenLastCalledWith({
      persistenceKey: 'orders-table',
      searchParamKey: 'sort',
      searchParamValue: JSON.stringify([
        { columnKey: 'status', direction: 'asc' },
        { columnKey: 'priority', direction: 'desc' },
      ]),
      slice: 'sorting',
      valueSlice: [
        { columnKey: 'status', direction: 'asc' },
        { columnKey: 'priority', direction: 'desc' },
      ],
    });
  });
});
