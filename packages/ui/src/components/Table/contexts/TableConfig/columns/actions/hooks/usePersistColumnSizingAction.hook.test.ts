// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { TablePersistenceWrapper } from '#ui/utils/tests/tablePersistenceWrapper.util';

import { usePersistColumnSizingAction } from './usePersistColumnSizingAction.hook';

const { persistMock } = vi.hoisted(() => ({ persistMock: vi.fn() }));
const { columnsGetMock, metaGetMock } = vi.hoisted(() => ({
  columnsGetMock: vi.fn(),
  metaGetMock: vi.fn(),
}));

vi.mock('#ui/hooks/usePersistCookieAction.hook', () => ({
  usePersistCookieAction: () => persistMock,
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      columnsStore: { get: columnsGetMock },
      metaStore: { get: metaGetMock },
    }),
  }),
);

const runPersistColumnSizing = (wrapper?: typeof TablePersistenceWrapper) => {
  const { result } = renderHook(() => usePersistColumnSizingAction(), {
    wrapper,
  });

  act(() => {
    result.current();
  });
};

describe('usePersistColumnSizingAction', () => {
  beforeEach(() => {
    persistMock.mockReset();
    columnsGetMock.mockReset();
    metaGetMock.mockReset();
  });

  it('submits the serialized columnSizing entry via the cookie action', () => {
    columnsGetMock.mockReturnValue({ columnSizing: { id: 120 } });
    metaGetMock.mockReturnValue({ appId: 'admin', persistenceKey: 'orders' });

    runPersistColumnSizing(TablePersistenceWrapper);

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

    runPersistColumnSizing(TablePersistenceWrapper);

    expect(persistMock).not.toHaveBeenCalled();
  });
  it('does not submit for a table whose column layout is transient', () => {
    columnsGetMock.mockReturnValue({ columnSizing: { id: 120 } });
    metaGetMock.mockReturnValue({
      appId: 'admin',
      isColumnLayoutTransient: true,
      persistenceKey: 'orders-group',
    });

    runPersistColumnSizing(TablePersistenceWrapper);

    expect(persistMock).not.toHaveBeenCalled();
  });

  it('does not submit with no layout persistence above it', () => {
    columnsGetMock.mockReturnValue({ columnSizing: { id: 120 } });
    metaGetMock.mockReturnValue({ appId: 'admin', persistenceKey: 'orders' });

    runPersistColumnSizing();

    expect(persistMock).not.toHaveBeenCalled();
  });
});
