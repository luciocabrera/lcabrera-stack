// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { columnsStore, columnStore, metaStore, mockGetTableColumnDrawerState } =
  vi.hoisted(() => ({
    columnsStore: {
      get: vi.fn(() => ({ columns: [{ key: 'status', label: 'Status' }] })),
    },
    columnStore: {
      get: vi.fn(() => ({ columnKey: 'status' })),
      set: vi.fn(),
    },
    metaStore: {
      get: vi.fn(() => ({
        isTableSettingsOpen: false,
        wasTableSettingsOpenBeforeColumnSettings: false,
      })),
      set: vi.fn(),
    },
    mockGetTableColumnDrawerState: vi.fn(() => ({
      columnFilter: undefined,
      columnKey: 'status',
      columnPinning: undefined,
      columnSizing: undefined,
      sorting: undefined,
    })),
  }));

vi.mock(
  '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      columnsStore,
      metaStore,
    }),
  }),
);

vi.mock(
  '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook',
  () => ({
    useColumnDrawerContextValue: () => ({
      columnStore,
    }),
  }),
);

vi.mock(
  '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils',
  () => ({
    getTableColumnDrawerState: mockGetTableColumnDrawerState,
  }),
);

import { useResetAllColumnDrawerSettings } from './useResetAllColumnDrawerSettings.hook';

describe('useResetAllColumnDrawerSettings', () => {
  beforeEach(() => {
    columnStore.get.mockReset();
    columnStore.get.mockReturnValue({ columnKey: 'status' });
    columnStore.set.mockReset();
    columnsStore.get.mockReset();
    columnsStore.get.mockReturnValue({
      columns: [{ key: 'status', label: 'Status' }],
    });
    metaStore.get.mockReset();
    metaStore.get.mockReturnValue({
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
    metaStore.set.mockReset();
    mockGetTableColumnDrawerState.mockClear();
  });

  it('restores table settings open state when closing after column drawer takeover', () => {
    metaStore.get.mockReturnValue({
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: true,
    });

    const { result } = renderHook(() => useResetAllColumnDrawerSettings());

    act(() => {
      result.current(true);
    });

    expect(metaStore.set).toHaveBeenCalledWith({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  });

  it('keeps table settings closed when there is no previous open snapshot', () => {
    const { result } = renderHook(() => useResetAllColumnDrawerSettings());

    act(() => {
      result.current(true);
    });

    expect(metaStore.set).toHaveBeenCalledWith({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  });
});
