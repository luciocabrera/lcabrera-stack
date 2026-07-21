// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePersistColumnSizingAction } from './usePersistColumnSizingAction.hook';

const { persistMock } = vi.hoisted(() => ({ persistMock: vi.fn() }));
const { columnsGetMock, metaGetMock } = vi.hoisted(() => ({
  columnsGetMock: vi.fn(),
  metaGetMock: vi.fn(),
}));

vi.mock('@lcabrera/ui/hooks/usePersistCookieAction.hook', () => ({
  usePersistCookieAction: () => persistMock,
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      columnsStore: { get: columnsGetMock },
      metaStore: { get: metaGetMock },
    }),
  }),
);

describe('usePersistColumnSizingAction', () => {
  beforeEach(() => {
    persistMock.mockReset();
    columnsGetMock.mockReset();
    metaGetMock.mockReset();
  });

  it('submits the serialized columnSizing entry via the cookie action', () => {
    columnsGetMock.mockReturnValue({ columnSizing: { id: 120 } });
    metaGetMock.mockReturnValue({ appId: 'admin', persistenceKey: 'orders' });

    const { result } = renderHook(() => usePersistColumnSizingAction());

    act(() => {
      result.current();
    });

    expect(persistMock).toHaveBeenCalledWith([
      {
        key: 'table-state-admin-orders-columnSizing',
        searchParamKey: '',
        searchParamValue: '',
        value: JSON.stringify({ value: { id: 120 }, version: 1 }),
      },
    ]);
  });

  it('does not submit when there is no persistence key', () => {
    columnsGetMock.mockReturnValue({ columnSizing: { id: 120 } });
    metaGetMock.mockReturnValue({});

    const { result } = renderHook(() => usePersistColumnSizingAction());

    act(() => {
      result.current();
    });

    expect(persistMock).not.toHaveBeenCalled();
  });
});
