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

const persistChromeOpen = (totalsPlacement?: 'first' | 'last') => {
  const { result } = renderHook(() => usePersistTableUiFlagsAction());

  act(() => {
    result.current({
      currentState: {
        isTableSettingsOpen: false,
        persistenceKey: 'orders',
      } as Partial<TableMetaState>,
      nextStatePatch: { isTableSettingsOpen: true },
      ...(totalsPlacement !== undefined && { totalsPlacement }),
    });
  });
};

const expectUiFlagsCookie = (value: Record<string, unknown>) => {
  expect(persistMock).toHaveBeenCalledWith([
    {
      key: 'table-state-orders-uiFlags',
      searchParamKey: '',
      searchParamValue: '',
      value: JSON.stringify({ value, version: 1 }),
    },
  ]);
};

describe('usePersistTableUiFlagsAction', () => {
  beforeEach(() => {
    persistMock.mockReset();
    setGroupingState({});
  });

  it('submits the merged drawer flags as a cookie entry', () => {
    persistChromeOpen();
    expectUiFlagsCookie({ isTableSettingsOpen: true });
  });

  it('keeps the live grouping placement when a chrome-only write omits it', () => {
    setGroupingState({ totalsPlacement: 'first' });
    persistChromeOpen();
    expectUiFlagsCookie({
      isTableSettingsOpen: true,
      totalsPlacement: 'first',
    });
  });

  it('lets an explicit placement win over the live grouping snapshot', () => {
    setGroupingState({ totalsPlacement: 'first' });
    persistChromeOpen('last');
    expectUiFlagsCookie({
      isTableSettingsOpen: true,
      totalsPlacement: 'last',
    });
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
