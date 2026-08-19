// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useBatchSetTableDrawerSettings } from './useBatchSetTableDrawerSettings.hook';

const {
  batchSetTableSettings,
  drawerColumnsStore,
  drawerGroupingStore,
  setDrawerGrouping,
  setDrawerState,
} = vi.hoisted(() => {
  let drawerState: Record<string, unknown> | undefined;
  let drawerGrouping: Record<string, unknown> = {
    aggregates: {},
    keys: [],
    mode: 'flat',
    periods: {},
  };

  return {
    batchSetTableSettings: vi.fn(),
    drawerColumnsStore: { get: vi.fn(() => drawerState) },
    drawerGroupingStore: { get: vi.fn(() => drawerGrouping) },
    setDrawerGrouping: (next: Record<string, unknown>) => {
      drawerGrouping = next;
    },
    setDrawerState: (next: Record<string, unknown> | undefined) => {
      drawerState = next;
    },
  };
});

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({
    columnsStore: drawerColumnsStore,
    groupingStore: drawerGroupingStore,
  }),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useBatchSetTableSettings: () => batchSetTableSettings,
}));

beforeEach(() => {
  batchSetTableSettings.mockClear();
  setDrawerState(undefined);
  setDrawerGrouping({ aggregates: {}, keys: [], mode: 'flat', periods: {} });
});

describe('useBatchSetTableDrawerSettings', () => {
  it('forwards the current drawer state as a fully-defaulted batch update', () => {
    setDrawerState({
      columnOrder: ['id', 'name'],
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });

    const { result } = renderHook(() => useBatchSetTableDrawerSettings());

    act(() => {
      result.current();
    });

    expect(batchSetTableSettings).toHaveBeenCalledExactlyOnceWith({
      grouping: { aggregates: {}, keys: [], mode: 'flat', periods: {} },
      settings: {
        columnFilters: {},
        columnOrder: ['id', 'name'],
        columnPinning: { left: [], right: [] },
        columnSizing: {},
        columnVisibility: new Set(),
        sorting: [{ columnKey: 'name', direction: 'asc' }],
      },
    });
  });

  it('produces safe empty defaults when the drawer has no state yet', () => {
    const { result } = renderHook(() => useBatchSetTableDrawerSettings());

    act(() => {
      result.current();
    });

    expect(batchSetTableSettings).toHaveBeenCalledExactlyOnceWith({
      grouping: { aggregates: {}, keys: [], mode: 'flat', periods: {} },
      settings: {
        columnFilters: {},
        columnOrder: [],
        columnPinning: { left: [], right: [] },
        columnSizing: {},
        columnVisibility: new Set(),
        sorting: [],
      },
    });
  });

  it('sends the staged grouping and the column draft in one commit call', () => {
    setDrawerState({ columnOrder: ['id', 'name'] });
    setDrawerGrouping({
      aggregates: { total: 'sum' },
      keys: ['status'],
      mode: 'flat',
      periods: {},
    });

    const { result } = renderHook(() => useBatchSetTableDrawerSettings());

    act(() => {
      result.current();
    });

    // Exactly once, with both drafts: two commit calls would each submit on
    // the shared persist fetcher key, and the second would abort the first.
    expect(batchSetTableSettings).toHaveBeenCalledExactlyOnceWith({
      grouping: {
        aggregates: { total: 'sum' },
        keys: ['status'],
        mode: 'flat',
        periods: {},
      },
      settings: {
        columnFilters: {},
        columnOrder: ['id', 'name'],
        columnPinning: { left: [], right: [] },
        columnSizing: {},
        columnVisibility: new Set(),
        sorting: [],
      },
    });
  });
});
