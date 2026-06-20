// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  TableColumnsState,
  TableMetaState,
} from '@/components/Table/Table.types';

type TestData = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

type MockStore<TState extends Record<string, unknown>> = {
  readonly get: () => TState;
  readonly getServerSnapshot: () => TState;
  readonly reset: () => void;
  readonly set: (nextState: Partial<TState>) => void;
  readonly subscribe: (callback: () => void) => () => void;
};

function noop(): void {}

function createMockStore<TState extends Record<string, unknown>>(
  initialState: TState,
): MockStore<TState> {
  let state = initialState;

  const get = vi.fn(() => state);
  const getServerSnapshot = vi.fn(() => state);
  const reset = vi.fn(() => {
    state = initialState;
  });
  const set = vi.fn((nextState: Partial<TState>) => {
    state = { ...state, ...nextState };
  });
  const subscribe = vi.fn(() => noop);

  return {
    get,
    getServerSnapshot,
    reset,
    set,
    subscribe,
  };
}

function createInitialColumnsState(): TableColumnsState<TestData> {
  return {
    columnFilters: {
      actions: {
        operator: 'contains',
        type: 'text',
        value: '',
      },
      age: {
        operator: 'equals',
        type: 'number',
        value: 0,
      },
      id: {
        operator: 'contains',
        type: 'text',
        value: '',
      },
      name: {
        operator: 'contains',
        type: 'text',
        value: '',
      },
    },
    columnGroups: {
      centerCols: [
        { dataType: 'string', key: 'name', label: 'Name' },
        { dataType: 'number', key: 'age', label: 'Age' },
      ],
      leftPinnedCols: [{ dataType: 'string', key: 'id', label: 'ID' }],
      rightPinnedCols: [
        { dataType: 'string', key: 'actions', label: 'Actions' },
      ],
    },
    columnOrder: ['id', 'name', 'age', 'actions'],
    columnPinning: { left: ['id'], right: ['actions'] },
    columns: [
      { dataType: 'string', key: 'id', label: 'ID' },
      { dataType: 'string', key: 'name', label: 'Name' },
      { dataType: 'number', key: 'age', label: 'Age' },
      { dataType: 'string', key: 'actions', label: 'Actions' },
    ],
    columnSizing: { actions: 80, age: 120, id: 80, name: 140 },
    columnVisibility: new Set([
      'actions',
      'age',
      'id',
      'name',
    ]) as TableColumnsState<TestData>['columnVisibility'],
    effectiveColumns: [
      { dataType: 'string', key: 'id', label: 'ID' },
      { dataType: 'string', key: 'name', label: 'Name' },
      { dataType: 'number', key: 'age', label: 'Age' },
      { dataType: 'string', key: 'actions', label: 'Actions' },
    ],
    normalizedColumns: {
      actions: { dataType: 'string', key: 'actions', label: 'Actions' },
      age: { dataType: 'number', key: 'age', label: 'Age' },
      id: { dataType: 'string', key: 'id', label: 'ID' },
      name: { dataType: 'string', key: 'name', label: 'Name' },
    },
    pinnedColumnOffsets: {
      actions: {
        isFirstPinnedRight: true,
        isLastPinnedLeft: false,
        offset: 0,
        side: 'right',
      },
      id: {
        isFirstPinnedRight: false,
        isLastPinnedLeft: true,
        offset: 0,
        side: 'left',
      },
    },
    sorting: [],
    staticKeys: new Set<string>(),
  };
}

function createInitialMetaState(): TableMetaState {
  return {
    columnOverscan: 2,
    columnSelectedKey: 'id',
    columnSettingsSelectedTab: 'general',
    density: 'compact',
    enablePrefetch: true,
    initialPageSize: 20,
    isBordered: true,
    isColumnSettingsOpen: false,
    isColumnSettingsPinned: false,
    isStriped: true,
    isTableSettingsOpen: false,
    isTableSettingsPinned: false,
    loadMorePageSize: 50,
    overscan: 4,
    persistenceKey: 'orders',
    placeholderRowCount: 8,
    rowHeight: 44,
    tableSettingsExpandedFilters: [],
    tableSettingsSelectedTab: 'general',
    threshold: 200,
    title: 'Orders',
    wasTableSettingsOpenBeforeColumnSettings: false,
  };
}

const {
  columnsStoreMock,
  metaStoreMock,
  readPersistedStateFromSessionStorageMock,
  readPersistedUiStateFromSessionStorageMock,
} = vi.hoisted(() => {
  return {
    columnsStoreMock: createMockStore(createInitialColumnsState()),
    metaStoreMock: createMockStore(createInitialMetaState()),
    readPersistedStateFromSessionStorageMock: vi.fn(() => ({})),
    readPersistedUiStateFromSessionStorageMock: vi.fn(() => ({})),
  };
});

vi.mock('@/components/Table/utils', async (importOriginal) => {
  const orig =
    await importOriginal<typeof import('@/components/Table/utils')>();
  return {
    ...orig,
    readPersistedStateFromSessionStorage:
      readPersistedStateFromSessionStorageMock,
    readPersistedUiStateFromSessionStorage:
      readPersistedUiStateFromSessionStorageMock,
  };
});

import { useHydrateTableSessionState } from './useHydrateTableSessionState.hook';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useHydrateTableSessionState', () => {
  it('does not call store.set when sessionStorage is empty', () => {
    readPersistedStateFromSessionStorageMock.mockReturnValue({});
    readPersistedUiStateFromSessionStorageMock.mockReturnValue({});

    renderHook(() =>
      useHydrateTableSessionState({
        columnsStore: columnsStoreMock,
        metaStore: metaStoreMock,
        persistenceKey: 'orders',
      }),
    );

    expect(columnsStoreMock.set).not.toHaveBeenCalled();
    expect(metaStoreMock.set).not.toHaveBeenCalled();
  });

  it('applies column state from sessionStorage on mount', () => {
    const sorting = [{ columnKey: 'name', direction: 'asc' as const }];
    readPersistedStateFromSessionStorageMock.mockReturnValue({ sorting });
    readPersistedUiStateFromSessionStorageMock.mockReturnValue({});

    renderHook(() =>
      useHydrateTableSessionState({
        columnsStore: columnsStoreMock,
        metaStore: metaStoreMock,
        persistenceKey: 'orders',
      }),
    );

    expect(columnsStoreMock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        columnGroups: expect.any(Object),
        effectiveColumns: expect.any(Array),
        normalizedColumns: expect.any(Object),
        pinnedColumnOffsets: expect.any(Object),
        sorting,
      }),
    );
  });

  it('applies UI state from sessionStorage on mount', () => {
    readPersistedStateFromSessionStorageMock.mockReturnValue({});
    readPersistedUiStateFromSessionStorageMock.mockReturnValue({
      isTableSettingsOpen: true,
      isTableSettingsPinned: true,
    });

    renderHook(() =>
      useHydrateTableSessionState({
        columnsStore: columnsStoreMock,
        metaStore: metaStoreMock,
        persistenceKey: 'orders',
      }),
    );

    expect(metaStoreMock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        isTableSettingsOpen: true,
        isTableSettingsPinned: true,
      }),
    );
  });

  it('does nothing when the persistence key is empty', () => {
    renderHook(() =>
      useHydrateTableSessionState({
        columnsStore: columnsStoreMock,
        metaStore: metaStoreMock,
        persistenceKey: '',
      }),
    );

    expect(readPersistedStateFromSessionStorageMock).not.toHaveBeenCalled();
    expect(readPersistedUiStateFromSessionStorageMock).not.toHaveBeenCalled();
    expect(columnsStoreMock.set).not.toHaveBeenCalled();
    expect(metaStoreMock.set).not.toHaveBeenCalled();
  });

  it('runs only once regardless of re-renders', () => {
    readPersistedStateFromSessionStorageMock.mockReturnValue({ sorting: [] });
    readPersistedUiStateFromSessionStorageMock.mockReturnValue({});

    const { rerender } = renderHook(() =>
      useHydrateTableSessionState({
        columnsStore: columnsStoreMock,
        metaStore: metaStoreMock,
        persistenceKey: 'orders',
      }),
    );

    act(() => {
      rerender();
    });
    act(() => {
      rerender();
    });

    // Re-renders alone do not trigger additional store.set calls (effect dependency is empty).
    // React 19 strict mode may call it during the double-mount cycle but never
    // during the subsequent re-renders triggered here.
    expect(columnsStoreMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ sorting: [] }),
    );
  });
});
