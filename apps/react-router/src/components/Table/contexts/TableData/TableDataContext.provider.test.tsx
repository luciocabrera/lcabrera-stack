// @vitest-environment jsdom

import { type ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  readPersistedDataStateFromSessionStorageMock,
  writePersistedDataStateToSessionStorageMock,
} = vi.hoisted(() => ({
  readPersistedDataStateFromSessionStorageMock: vi.fn(),
  writePersistedDataStateToSessionStorageMock: vi.fn(),
}));

vi.mock('@/components/Table/utils', async (importOriginal) => {
  const orig =
    await importOriginal<typeof import('@/components/Table/utils')>();

  return {
    ...orig,
    readPersistedDataStateFromSessionStorage:
      readPersistedDataStateFromSessionStorageMock,
    writePersistedDataStateToSessionStorage:
      writePersistedDataStateToSessionStorageMock,
  };
});

import { TableDataProvider } from './TableDataContext.provider';
import { useGetTableData } from './data/selectors/useGetTableData.hook';
import { useGetTableHasMore } from './data/selectors/useGetTableHasMore.hook';
import { useGetTableTotalLoadedRows } from './data/selectors/useGetTableTotalLoadedRows.hook';

type TestRow = {
  readonly id: number;
};

type WrapperProps = {
  readonly children: ReactNode;
};

const wrapper = ({ children }: WrapperProps) => (
  <TableDataProvider<TestRow>
    dataState={{
      data: [{ id: 1 }],
      isLoading: false,
      isLoadingMore: false,
      totalRows: 3,
    }}
    isPersistenceEnabled
    persistenceKey='orders'
  >
    {children}
  </TableDataProvider>
);

describe('TableDataProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rehydrates persisted rows and recomputes derived pagination state', async () => {
    readPersistedDataStateFromSessionStorageMock.mockReturnValue({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      totalRows: 3,
    });

    const { result } = renderHook(
      () => ({
        data: useGetTableData<TestRow>(),
        hasMore: useGetTableHasMore(),
        totalLoadedRows: useGetTableTotalLoadedRows(),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        data: [{ id: 1 }, { id: 2 }, { id: 3 }],
        hasMore: false,
        totalLoadedRows: 3,
      });
    });
  });

  it('skips hydration when persisted rows are from a different snapshot', async () => {
    readPersistedDataStateFromSessionStorageMock.mockReturnValue({
      data: [{ id: 9 }],
      totalRows: 1,
    });

    const { result } = renderHook(
      () => ({
        data: useGetTableData<TestRow>(),
        hasMore: useGetTableHasMore(),
        totalLoadedRows: useGetTableTotalLoadedRows(),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        data: [{ id: 1 }],
        hasMore: true,
        totalLoadedRows: 1,
      });
    });
  });
});
