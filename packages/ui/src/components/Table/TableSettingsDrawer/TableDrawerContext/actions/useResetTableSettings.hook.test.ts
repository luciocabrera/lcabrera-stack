// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useResetTableSettings } from './useResetTableSettings.hook';

const {
  drawerColumnsStore,
  drawerGroupingStore,
  setTableColumnsState,
  setTableGrouping,
  tableColumnsState,
  tableColumnsStore,
  tableGroupingStore,
} = vi.hoisted(() => {
  let state:
    | undefined
    | {
        readonly columnFilters?: Record<string, unknown>;
        readonly columnOrder?: readonly string[];
        readonly columnPinning?: {
          readonly left: readonly string[];
          readonly right: readonly string[];
        };
        readonly columnSizing?: Record<string, number>;
        readonly columnVisibility?: Record<string, boolean>;
        readonly sorting?: readonly unknown[];
      };

  let grouping: {
    readonly aggregates: Record<string, string>;
    readonly keys: readonly string[];
    readonly mode: string;
    readonly periods: Record<string, string>;
    readonly shares: readonly string[];
  } = { aggregates: {}, keys: [], mode: 'flat', periods: {}, shares: [] };

  return {
    drawerColumnsStore: {
      set: vi.fn(),
    },
    drawerGroupingStore: {
      set: vi.fn(),
    },
    setTableColumnsState: (next: typeof state) => {
      state = next;
    },
    setTableGrouping: (next: typeof grouping) => {
      grouping = next;
    },
    tableColumnsState: () => state,
    tableColumnsStore: {
      get: vi.fn(() => state),
    },
    tableGroupingStore: {
      get: vi.fn(() => grouping),
    },
  };
});

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      columnsStore: tableColumnsStore,
      groupingStore: tableGroupingStore,
    }),
  }),
);

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({
    columnsStore: drawerColumnsStore,
    groupingStore: drawerGroupingStore,
  }),
}));

describe('useResetTableSettings', () => {
  beforeEach(() => {
    setTableColumnsState(undefined);
    setTableGrouping({
      aggregates: {},
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    });
    drawerColumnsStore.set.mockClear();
    drawerGroupingStore.set.mockClear();
  });

  it('copies table config slices into drawer state when values exist', () => {
    setTableColumnsState({
      columnFilters: { status: ['equals', 'open'] },
      columnOrder: ['id', 'status'],
      columnPinning: { left: ['id'], right: ['status'] },
      columnSizing: { id: 120 },
      columnVisibility: { id: true, status: true },
      sorting: [{ column: 'id', direction: 'asc' }],
    });

    const { result } = renderHook(() => useResetTableSettings());

    act(() => {
      result.current();
    });

    expect(tableColumnsState()).toBeDefined();
    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnFilters: { status: ['equals', 'open'] },
      columnOrder: ['id', 'status'],
      columnPinning: { left: ['id'], right: ['status'] },
      columnSizing: { id: 120 },
      columnVisibility: { id: true, status: true },
      sorting: [{ column: 'id', direction: 'asc' }],
    });
  });

  it('applies safe empty defaults when table config state is missing', () => {
    const { result } = renderHook(() => useResetTableSettings());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnFilters: {},
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columnSizing: {},
      columnVisibility: new Set(),
      sorting: [],
    });
  });
  it('re-seeds the grouping draft from the live grouping, discarding what was staged', () => {
    setTableGrouping({
      aggregates: { total: 'sum' },
      keys: ['status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });

    const { result } = renderHook(() => useResetTableSettings());

    act(() => {
      result.current();
    });

    expect(drawerGroupingStore.set).toHaveBeenCalledWith({
      aggregates: { total: 'sum' },
      keys: ['status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });
});
