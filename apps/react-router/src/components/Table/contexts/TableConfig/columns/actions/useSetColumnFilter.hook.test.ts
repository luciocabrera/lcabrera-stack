// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSetColumnFilter } from './useSetColumnFilter.hook';

const {
  mockPersistTableState,
  mockSerializeFiltersToURL,
  mockUsePersistTableStateAction,
  mockUseTableConfigContextValue,
  mockUseTableDataContextValue,
  setColumnsState,
} = vi.hoisted(() => {
  let columnsState = {
    columnFilters: {},
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
  const mockSerializeFiltersToURL = vi.fn((filters) => JSON.stringify(filters));

  return {
    mockPersistTableState,
    mockSerializeFiltersToURL,
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

vi.mock('@/utils/urlState', () => ({
  serializeFiltersToURL: mockSerializeFiltersToURL,
}));

describe('useSetColumnFilter', () => {
  beforeEach(() => {
    setColumnsState({
      columnFilters: {},
    });
    mockPersistTableState.mockReset();
    mockPersistTableState.mockReturnValue(true);
    mockSerializeFiltersToURL.mockClear();
  });

  it('reads the latest column filters on every invocation', () => {
    const { result } = renderHook(() =>
      useSetColumnFilter<{
        readonly priority: string;
        readonly status: string;
      }>(),
    );

    act(() => {
      result.current({
        columnKey: 'status',
        filter: {
          operator: 'equals',
          type: 'text',
          value: 'active',
        },
      });
    });

    act(() => {
      result.current({
        columnKey: 'priority',
        filter: {
          operator: 'equals',
          type: 'text',
          value: 'high',
        },
      });
    });

    const valueSlice = {
      priority: {
        operator: 'equals',
        type: 'text',
        value: 'high',
      },
      status: {
        operator: 'equals',
        type: 'text',
        value: 'active',
      },
    };

    const lastCall = mockPersistTableState.mock.lastCall?.[0] as
      | undefined
      | {
          readonly persistenceKey: string;
          readonly searchParamKey: string;
          readonly searchParamValue: string;
          readonly slice: string;
          readonly valueSlice: typeof valueSlice;
        };

    expect(lastCall?.searchParamKey).toBe('filters');
    expect(JSON.parse(lastCall?.searchParamValue ?? '{}')).toEqual(valueSlice);
  });
});
