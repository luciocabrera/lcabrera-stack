// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableMetaState } from '#ui/components/Table/Table.types';

import { usePersistTableUiFlagsAction } from './usePersistTableUiFlagsAction.hook';

const { groupingStore, persistMock, setGroupingState } = vi.hoisted(() => {
  let groupingState: { readonly totalsPlacement?: 'first' | 'last' } = {};

  return {
    groupingStore: {
      get: () => groupingState,
    },
    persistMock: vi.fn(),
    setGroupingState: (nextState: {
      readonly totalsPlacement?: 'first' | 'last';
    }) => {
      groupingState = nextState;
    },
  };
});

vi.mock('#ui/hooks/usePersistCookieAction.hook', () => ({
  usePersistCookieAction: () => persistMock,
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ groupingStore }),
  }),
);

describe('usePersistTableUiFlagsAction', () => {
  beforeEach(() => {
    persistMock.mockReset();
    setGroupingState({});
  });

  it('submits the merged drawer flags as a cookie entry', () => {
    const { result } = renderHook(() => usePersistTableUiFlagsAction());

    act(() => {
      result.current({
        currentState: {
          isTableSettingsOpen: false,
          persistenceKey: 'orders',
        } as Partial<TableMetaState>,
        nextStatePatch: { isTableSettingsOpen: true },
      });
    });

    expect(persistMock).toHaveBeenCalledWith([
      {
        key: 'table-state-orders-uiFlags',
        searchParamKey: '',
        searchParamValue: '',
        value: JSON.stringify({
          value: { isTableSettingsOpen: true },
          version: 1,
        }),
      },
    ]);
  });

  it('keeps the live grouping placement when a chrome-only write omits it', () => {
    setGroupingState({ totalsPlacement: 'first' });
    const { result } = renderHook(() => usePersistTableUiFlagsAction());

    act(() => {
      result.current({
        currentState: {
          isTableSettingsOpen: false,
          persistenceKey: 'orders',
        } as Partial<TableMetaState>,
        nextStatePatch: { isTableSettingsOpen: true },
      });
    });

    expect(persistMock).toHaveBeenCalledWith([
      {
        key: 'table-state-orders-uiFlags',
        searchParamKey: '',
        searchParamValue: '',
        value: JSON.stringify({
          value: { isTableSettingsOpen: true, totalsPlacement: 'first' },
          version: 1,
        }),
      },
    ]);
  });

  it('lets an explicit placement win over the live grouping snapshot', () => {
    setGroupingState({ totalsPlacement: 'first' });
    const { result } = renderHook(() => usePersistTableUiFlagsAction());

    act(() => {
      result.current({
        currentState: {
          isTableSettingsOpen: false,
          persistenceKey: 'orders',
        } as Partial<TableMetaState>,
        nextStatePatch: { isTableSettingsOpen: true },
        totalsPlacement: 'last',
      });
    });

    expect(persistMock).toHaveBeenCalledWith([
      {
        key: 'table-state-orders-uiFlags',
        searchParamKey: '',
        searchParamValue: '',
        value: JSON.stringify({
          value: { isTableSettingsOpen: true, totalsPlacement: 'last' },
          version: 1,
        }),
      },
    ]);
  });

  it('does not submit when there is no persistence key', () => {
    const { result } = renderHook(() => usePersistTableUiFlagsAction());

    act(() => {
      result.current({
        currentState: {} as Partial<TableMetaState>,
        nextStatePatch: { isTableSettingsOpen: true },
      });
    });

    expect(persistMock).not.toHaveBeenCalled();
  });
});
