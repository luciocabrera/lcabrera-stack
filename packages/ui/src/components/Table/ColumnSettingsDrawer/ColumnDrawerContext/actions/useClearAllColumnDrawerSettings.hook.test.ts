// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { columnStore, metaStore, persistUiFlagsMock } = vi.hoisted(() => ({
  columnStore: {
    get: vi.fn<() => { readonly columnKey: string | undefined }>(() => ({
      columnKey: 'status',
    })),
    set: vi.fn(),
  },
  metaStore: {
    get: vi.fn(() => ({
      isTableSettingsOpen: false,
      persistenceKey: 'orders',
      wasTableSettingsOpenBeforeColumnSettings: true,
    })),
    set: vi.fn(),
  },
  persistUiFlagsMock: vi.fn(),
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/meta/actions/usePersistTableUiFlagsAction.hook',
  () => ({
    usePersistTableUiFlagsAction: () => persistUiFlagsMock,
  }),
);

vi.mock(
  '@repo/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook',
  () => ({
    useColumnDrawerContextValue: () => ({
      columnStore,
    }),
  }),
);

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      metaStore,
    }),
  }),
);

import { useClearAllColumnDrawerSettings } from './useClearAllColumnDrawerSettings.hook';

describe('useClearAllColumnDrawerSettings', () => {
  beforeEach(() => {
    columnStore.get.mockReset();
    columnStore.get.mockReturnValue({ columnKey: 'status' });
    columnStore.set.mockReset();
    metaStore.get.mockReset();
    metaStore.get.mockReturnValue({
      isTableSettingsOpen: false,
      persistenceKey: 'orders',
      wasTableSettingsOpenBeforeColumnSettings: true,
    });
    metaStore.set.mockReset();
    persistUiFlagsMock.mockReset();
  });

  it('clears the drawer state and persists the close patch when requested', () => {
    const { result } = renderHook(() => useClearAllColumnDrawerSettings());

    act(() => {
      result.current(true);
    });

    expect(columnStore.set).toHaveBeenCalledWith({
      columnFilter: undefined,
      columnKey: 'status',
      columnPinning: undefined,
      columnSizing: undefined,
      sorting: undefined,
    });
    expect(persistUiFlagsMock).toHaveBeenCalledWith({
      currentState: {
        isTableSettingsOpen: false,
        persistenceKey: 'orders',
        wasTableSettingsOpenBeforeColumnSettings: true,
      },
      nextStatePatch: {
        isColumnSettingsOpen: false,
        isTableSettingsOpen: true,
        wasTableSettingsOpenBeforeColumnSettings: false,
      },
    });
    expect(metaStore.set).toHaveBeenCalledWith({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  });

  it('does nothing when there is no selected column key', () => {
    columnStore.get.mockReturnValue({
      columnKey: undefined,
    } as { readonly columnKey: string | undefined });

    const { result } = renderHook(() => useClearAllColumnDrawerSettings());

    act(() => {
      result.current(true);
    });

    expect(columnStore.set).not.toHaveBeenCalled();
    expect(persistUiFlagsMock).not.toHaveBeenCalled();
    expect(metaStore.set).not.toHaveBeenCalled();
  });
});
