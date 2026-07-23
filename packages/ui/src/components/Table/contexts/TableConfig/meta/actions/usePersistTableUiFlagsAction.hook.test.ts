// @vitest-environment jsdom

import type { TableMetaState } from '@lcabrera/ui/components/Table/Table.types';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { usePersistTableUiFlagsAction } from './usePersistTableUiFlagsAction.hook';

const { persistMock } = vi.hoisted(() => ({ persistMock: vi.fn() }));

vi.mock('@lcabrera/ui/hooks/usePersistCookieAction.hook', () => ({
  usePersistCookieAction: () => persistMock,
}));

describe('usePersistTableUiFlagsAction', () => {
  beforeEach(() => {
    persistMock.mockReset();
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
