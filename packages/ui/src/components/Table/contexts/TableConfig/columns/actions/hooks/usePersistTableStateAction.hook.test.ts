// @vitest-environment jsdom

import type { TablePersistenceConfig } from '@lcabrera/ui/components/Table/Table.types';

import { MAX_COOKIE_ENTRY_VALUE_LENGTH } from '@lcabrera/ui/constants/globalSettings.constants';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePersistTableStateAction } from './usePersistTableStateAction.hook';

const { notifyMock, serializeStateSliceMock, submitMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
  serializeStateSliceMock: vi.fn(),
  submitMock: vi.fn(),
}));
const { mockUseFetcher, mockUseLocation } = vi.hoisted(() => ({
  mockUseFetcher: () => ({ submit: submitMock }),
  mockUseLocation: () => ({
    pathname: '/enterprise-orders',
    search: '?page=2',
  }),
}));

const { metaStoreGetMock } = vi.hoisted(() => ({
  metaStoreGetMock: vi.fn<() => Record<string, unknown> | undefined>(
    () => ({}),
  ),
}));

vi.mock('react-router', () => ({
  useFetcher: mockUseFetcher,
  useLocation: mockUseLocation,
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      metaStore: { get: metaStoreGetMock },
    }),
  }),
);

vi.mock('@lcabrera/ui/components/Table/utils', () => ({
  serializeStateSlice: serializeStateSliceMock,
}));

vi.mock('@lcabrera/ui/contexts/NotificationContext/actions', () => ({
  useNotifyAction: () => notifyMock,
}));

describe('usePersistTableStateAction', () => {
  beforeEach(() => {
    notifyMock.mockReset();
    serializeStateSliceMock.mockReset();
    submitMock.mockReset();
    metaStoreGetMock.mockReset();
    metaStoreGetMock.mockReturnValue({});
  });

  it('serializes and submits a single persistence entry', () => {
    const slice: keyof TablePersistenceConfig = 'sorting';

    serializeStateSliceMock.mockReturnValue({
      key: 'orders:sorting',
      value: '[{"columnKey":"id","direction":"asc"}]',
    });

    const { result } = renderHook(() => usePersistTableStateAction());

    act(() => {
      result.current({
        persistenceKey: 'orders',
        searchParamKey: 'sort',
        searchParamValue: 'id:asc',
        slice,
        valueSlice: [{ columnKey: 'id', direction: 'asc' }],
      });
    });

    expect(serializeStateSliceMock).toHaveBeenCalledWith({
      persistenceKey: 'orders',
      slice,
      value: [{ columnKey: 'id', direction: 'asc' }],
    });
    expect(submitMock).toHaveBeenCalledWith(
      {
        currentUrl: '/enterprise-orders?page=2',
        entries: JSON.stringify([
          {
            key: 'orders:sorting',
            searchParamKey: 'sort',
            searchParamValue: 'id:asc',
            value: '[{"columnKey":"id","direction":"asc"}]',
          },
        ]),
      },
      { action: '/_action/persist-cookie', method: 'POST' },
    );
  });

  it('persists to the cookie only, never to sessionStorage', () => {
    serializeStateSliceMock.mockReturnValue({
      key: 'orders:sorting',
      value: '[{"columnKey":"id","direction":"asc"}]',
    });

    const { result } = renderHook(() => usePersistTableStateAction());

    act(() => {
      result.current({
        persistenceKey: 'orders',
        slice: 'sorting',
        valueSlice: [{ columnKey: 'id', direction: 'asc' }],
      });
    });

    expect(submitMock).toHaveBeenCalledTimes(1);
  });

  it('serializes batch entries and fills optional search params with empty strings', () => {
    const sliceOne: keyof TablePersistenceConfig = 'columnFilters';
    const sliceTwo: keyof TablePersistenceConfig = 'columnOrder';

    serializeStateSliceMock
      .mockReturnValueOnce({
        key: 'orders:filters',
        value: '{"status":"active"}',
      })
      .mockReturnValueOnce({
        key: 'orders:order',
        value: '["id","status"]',
      });

    const { result } = renderHook(() => usePersistTableStateAction());

    act(() => {
      result.current([
        {
          persistenceKey: 'orders',
          slice: sliceOne,
          valueSlice: { status: 'active' },
        },
        {
          persistenceKey: 'orders',
          searchParamKey: 'columns',
          searchParamValue: 'id,status',
          slice: sliceTwo,
          valueSlice: ['id', 'status'],
        },
      ]);
    });

    expect(submitMock).toHaveBeenCalledWith(
      {
        currentUrl: '/enterprise-orders?page=2',
        entries: JSON.stringify([
          {
            key: 'orders:filters',
            searchParamKey: '',
            searchParamValue: '',
            value: '{"status":"active"}',
          },
          {
            key: 'orders:order',
            searchParamKey: 'columns',
            searchParamValue: 'id,status',
            value: '["id","status"]',
          },
        ]),
      },
      { action: '/_action/persist-cookie', method: 'POST' },
    );
  });

  it('blocks oversized entries before cookie persistence', () => {
    serializeStateSliceMock.mockReturnValue({
      key: 'orders:filters',
      value: 'x'.repeat(MAX_COOKIE_ENTRY_VALUE_LENGTH + 1),
    });

    const { result } = renderHook(() => usePersistTableStateAction());

    let isPersistenceResult = true;

    act(() => {
      isPersistenceResult = result.current({
        persistenceKey: 'orders',
        searchParamKey: 'filters',
        searchParamValue: '{"status":"active"}',
        slice: 'columnFilters',
        valueSlice: { status: 'active' },
      });
    });

    expect(isPersistenceResult).toBe(false);
    expect(notifyMock).toHaveBeenCalledWith({
      durationMs: 10_000,
      message:
        'This table state is too large to save safely. Remove some filters or sorting before applying the change.',
      title: 'Table state too large',
      variant: 'error',
    });
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('scopes serialization with the appId from the meta store', () => {
    metaStoreGetMock.mockReturnValue({ appId: 'admin-system' });
    serializeStateSliceMock.mockReturnValue({
      key: 'table-state-admin-system-orders-sorting',
      value: '[]',
    });

    const { result } = renderHook(() => usePersistTableStateAction());

    act(() => {
      result.current({
        persistenceKey: 'orders',
        slice: 'sorting',
        valueSlice: [],
      });
    });

    expect(serializeStateSliceMock).toHaveBeenCalledWith({
      appId: 'admin-system',
      persistenceKey: 'orders',
      slice: 'sorting',
      value: [],
    });
  });
});
