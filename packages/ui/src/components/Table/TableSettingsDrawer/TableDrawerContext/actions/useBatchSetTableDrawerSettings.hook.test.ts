// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useBatchSetTableDrawerSettings } from './useBatchSetTableDrawerSettings.hook';

const { batchSetTableSettings, drawerColumnsStore, setDrawerState } =
  vi.hoisted(() => {
    let drawerState: Record<string, unknown> | undefined;

    return {
      batchSetTableSettings: vi.fn(),
      drawerColumnsStore: { get: vi.fn(() => drawerState) },
      setDrawerState: (next: Record<string, unknown> | undefined) => {
        drawerState = next;
      },
    };
  });

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useBatchSetTableSettings: () => batchSetTableSettings,
  }),
);

beforeEach(() => {
  batchSetTableSettings.mockClear();
  setDrawerState(undefined);
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
      columnFilters: {},
      columnOrder: ['id', 'name'],
      columnPinning: { left: [], right: [] },
      columnSizing: {},
      columnVisibility: new Set(),
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });
  });

  it('produces safe empty defaults when the drawer has no state yet', () => {
    const { result } = renderHook(() => useBatchSetTableDrawerSettings());

    act(() => {
      result.current();
    });

    expect(batchSetTableSettings).toHaveBeenCalledExactlyOnceWith({
      columnFilters: {},
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columnSizing: {},
      columnVisibility: new Set(),
      sorting: [],
    });
  });
});
