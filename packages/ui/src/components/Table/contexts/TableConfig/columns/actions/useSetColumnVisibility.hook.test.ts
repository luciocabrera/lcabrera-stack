// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createTableConfigColumnsActionMocks } from '#ui/utils/tests/createTableConfigColumnsActionMocks.util';

import { useSetColumnVisibility } from './useSetColumnVisibility.hook';

const createInitialColumnsState = () => {
  return {
    columnOrder: ['id', 'name', 'age'],
    columnPinning: { left: ['id'], right: [] },
    columns: [
      // Declared static as well as listed in `staticKeys` below — the two are
      // the same fact, and the fixture asserting only one of them is what let
      // a measure of a static column reach the write path unnoticed.
      { isStatic: true, key: 'id', label: 'ID' },
      { isStatic: false, key: 'name', label: 'Name' },
      { isStatic: false, key: 'age', label: 'Age' },
    ],
    columnSizing: {},
    columnVisibility: new Set<string>(),
    staticKeys: new Set<string>(['id']),
  };
};

const {
  mockColumnsStore,
  mockMetaStore,
  mockPersistTableState,
  mockUsePersistTableStateAction,
  mockUseTableConfigContextValue,
  resetMocks,
  setAggregates,
  setColumnsState,
  setGroupingKeys,
} = createTableConfigColumnsActionMocks({
  initialColumnsState: createInitialColumnsState(),
  persistenceKey: 'orders-table',
});

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => mockUseTableConfigContextValue(),
  }),
);

vi.mock('./hooks/usePersistTableStateAction.hook', () => ({
  usePersistTableStateAction: () => mockUsePersistTableStateAction(),
}));

type TData = {
  readonly age: string;
  readonly id: string;
  readonly name: string;
};

describe('useSetColumnVisibility', () => {
  beforeEach(() => {
    setColumnsState(createInitialColumnsState());
    resetMocks();
  });

  it('hides a currently-visible column', () => {
    const { result } = renderHook(() => useSetColumnVisibility<TData>());

    act(() => {
      result.current({ columnKey: 'name', isVisible: false });
    });

    expect(mockPersistTableState).toHaveBeenCalledWith([
      {
        persistenceKey: 'orders-table',
        slice: 'columnVisibility',
        valueSlice: new Set(['name']),
      },
    ]);
    expect(mockColumnsStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ columnVisibility: new Set(['name']) }),
    );
    expect(mockMetaStore.set).toHaveBeenCalledWith({ drawersSyncNonce: 1 });
  });

  it('shows a currently-hidden column', () => {
    setColumnsState({
      ...createInitialColumnsState(),
      columnVisibility: new Set(['age', 'name']),
    });

    const { result } = renderHook(() => useSetColumnVisibility<TData>());

    act(() => {
      result.current({ columnKey: 'name', isVisible: true });
    });

    expect(mockColumnsStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ columnVisibility: new Set(['age']) }),
    );
  });

  it('is a no-op for static columns', () => {
    const { result } = renderHook(() => useSetColumnVisibility<TData>());

    act(() => {
      result.current({ columnKey: 'id', isVisible: false });
    });

    expect(mockPersistTableState).not.toHaveBeenCalled();
    expect(mockColumnsStore.set).not.toHaveBeenCalled();
    expect(mockMetaStore.set).not.toHaveBeenCalled();
  });

  it('does not commit when persistence fails', () => {
    mockPersistTableState.mockReturnValueOnce(false);

    const { result } = renderHook(() => useSetColumnVisibility<TData>());

    act(() => {
      result.current({ columnKey: 'name', isVisible: false });
    });

    expect(mockColumnsStore.set).not.toHaveBeenCalled();
    expect(mockMetaStore.set).not.toHaveBeenCalled();
  });
});

describe('hiding a measure column', () => {
  beforeEach(() => {
    setColumnsState({
      columnOrder: ['id', 'name', 'amount'],
      columnPinning: { left: [], right: [] },
      columns: [
        { isStatic: true, key: 'id', label: 'ID' },
        { isStatic: false, key: 'name', label: 'Name' },
        { isStatic: false, key: 'amount', label: 'Amount' },
      ],
      columnSizing: {},
      columnVisibility: new Set<string>(),
      staticKeys: new Set<string>(['id']),
    });
    resetMocks();
    setGroupingKeys(['name']);
    setAggregates([
      { columnKey: 'amount', fn: 'avg' },
      { columnKey: 'amount', fn: 'min' },
    ]);
  });

  it('hides the column it measures, so the drawer can bring it back', () => {
    // Writing the derived key here was a trap state: `columnVisibility` is
    // persisted to the layout cookie, but the settings drawer lists the
    // **declared** columns, so nothing in the UI could remove `amount:avg`
    // again except the blanket "Clear Visibility & Pinning" — which discards
    // every other hidden column and every pin with it. Symmetric with
    // `useSetColumnPinning`, and it is what `toDeclaredColumnKey`'s own rule
    // says: the layout state stays declared-only.
    const { result } = renderHook(() =>
      useSetColumnVisibility<Record<string, unknown>>(),
    );

    act(() => {
      result.current({ columnKey: 'amount:avg', isVisible: false });
    });

    expect(mockColumnsStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        columnVisibility: new Set(['amount']),
      }),
    );
  });
});

describe('hiding a measure of a static column', () => {
  beforeEach(() => {
    setColumnsState({
      columnOrder: ['id', 'name', 'amount'],
      columnPinning: { left: [], right: [] },
      columns: [
        { isStatic: true, key: 'id', label: 'ID' },
        { isStatic: false, key: 'name', label: 'Name' },
        { isStatic: true, key: 'amount', label: 'Amount' },
      ],
      columnSizing: {},
      columnVisibility: new Set<string>(),
      staticKeys: new Set<string>(['amount', 'id']),
    });
    resetMocks();
    setGroupingKeys(['name']);
    setAggregates([{ columnKey: 'amount', fn: 'avg' }]);
  });

  it('refuses, because the guard runs on the column actually being written', () => {
    // `staticKeys` is built from the **declared** columns, so it can never
    // hold `amount:avg` — guarding on the raw key let a measure walk straight
    // past a lock that `useSetColumnPinning` enforces, because its guard sits
    // downstream of the same mapping. The write then hid `amount` itself, a
    // column the consumer marked unhideable, and the drawer does not list
    // static columns — so only "Clear Visibility & Pinning" got it back.
    const { result } = renderHook(() =>
      useSetColumnVisibility<Record<string, unknown>>(),
    );

    act(() => {
      result.current({ columnKey: 'amount:avg', isVisible: false });
    });

    expect(mockPersistTableState).not.toHaveBeenCalled();
    expect(mockColumnsStore.set).not.toHaveBeenCalled();
    expect(mockMetaStore.set).not.toHaveBeenCalled();
  });
});
