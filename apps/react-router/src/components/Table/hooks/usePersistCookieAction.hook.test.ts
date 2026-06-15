// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TablePersistenceConfig } from '../Table.types';

import { usePersistTableStateAction } from './usePersistCookieAction.hook';

const { serializeStateSliceMock, submitMock, writeToSessionStorageMock } =
  vi.hoisted(() => ({
    serializeStateSliceMock: vi.fn(),
    submitMock: vi.fn(),
    writeToSessionStorageMock: vi.fn(),
  }));
const { mockUseFetcher, mockUseLocation } = vi.hoisted(() => ({
  mockUseFetcher: () => ({ submit: submitMock }),
  mockUseLocation: () => ({
    pathname: '/enterprise-orders',
    search: '?page=2',
  }),
}));

vi.mock('react-router', () => ({
  useFetcher: mockUseFetcher,
  useLocation: mockUseLocation,
}));

vi.mock('../utils', () => ({
  serializeStateSlice: serializeStateSliceMock,
}));

vi.mock('@/utils/storage', () => ({
  writeToSessionStorage: writeToSessionStorageMock,
}));

describe('usePersistTableStateAction', () => {
  beforeEach(() => {
    serializeStateSliceMock.mockReset();
    submitMock.mockReset();
    writeToSessionStorageMock.mockReset();
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

  it('also writes each entry to sessionStorage synchronously before submitting to server', () => {
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

    expect(writeToSessionStorageMock).toHaveBeenCalledWith({
      key: 'orders:sorting',
      value: '[{"columnKey":"id","direction":"asc"}]',
    });
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

    expect(writeToSessionStorageMock).toHaveBeenCalledTimes(2);
  });
});
