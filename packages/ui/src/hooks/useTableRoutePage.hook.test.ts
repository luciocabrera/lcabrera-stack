// @vitest-environment jsdom

import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table';
import type { TableMetaState } from '#ui/components/Table/Table.types';

import { useTableRoutePage } from './useTableRoutePage.hook';

type Response = {
  readonly data: readonly Row[];
  readonly hasMore: boolean;
};

type Row = {
  readonly order_id: number;
  readonly order_status: string;
};

const { useLoaderDataMock } = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn(),
}));

vi.mock('react-router', () => ({ useLoaderData: useLoaderDataMock }));

const columns: TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'order_id', label: 'order_id' },
  { key: 'order_status', label: 'order_status' },
];

const columnFilters = {
  order_status: { operator: 'equals', value: 'shipped' },
};

const dataPromise = Promise.resolve<Response>({ data: [], hasMore: false });
const metaState = { title: 'Orders' };

const loaderData = {
  columnsState: {
    columnFilters,
    columnOrder: [],
    columnPinning: { left: [], right: [] },
    columns,
    columnSizing: {},
    columnVisibility: new Set(),
    sorting: [{ columnKey: 'order_status', direction: 'desc' }],
  },
  dataPromise,
  key: '',
  metaState,
};

const lastRow: Row = { order_id: 42, order_status: 'shipped' };

const setup = (metaOverrides?: Partial<TableMetaState>) => {
  useLoaderDataMock.mockReturnValue(
    metaOverrides
      ? { ...loaderData, metaState: { ...metaState, ...metaOverrides } }
      : loaderData,
  );

  const fetchPage = vi.fn<(query: PaginatedQuery) => Promise<Response>>(
    async () => ({ data: [], hasMore: false }),
  );
  const { result } = renderHook(() =>
    useTableRoutePage<Row, Response>({ fetchPage }),
  );

  return { fetchPage, result };
};

beforeEach(() => {
  useLoaderDataMock.mockReset();
  useLoaderDataMock.mockReturnValue(loaderData);
});

describe('useTableRoutePage', () => {
  it('passes the loader state straight through to the table props', () => {
    const { result } = setup();

    expect(result.current.columnsState).toBe(loaderData.columnsState);
    expect(result.current.dataPromise).toBe(dataPromise);
    expect(result.current.metaState).toBe(metaState);
  });

  it('re-derives the primary-key tiebreaker for the load-more query', async () => {
    const { fetchPage, result } = setup();

    await result.current.onLoadMore({ limit: 50, skip: 50 });

    expect(fetchPage).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 50,
        skip: 50,
        sorting: [
          { columnKey: 'order_status', direction: 'desc' },
          { columnKey: 'order_id', direction: 'asc' },
        ],
      }),
    );
  });

  it('sends neither filter nor cursor by default', async () => {
    const { fetchPage, result } = setup();

    await result.current.onLoadMore({ lastRow, limit: 50, skip: 50 });

    const query = fetchPage.mock.calls[0]?.[0];
    expect(query?.cursor).toBeUndefined();
    expect(query?.filter).toBeUndefined();
  });

  it('sends the column filters when the meta declares server filtering', async () => {
    const { fetchPage, result } = setup({ isServerFilterEnabled: true });

    await result.current.onLoadMore({ limit: 50, skip: 50 });

    expect(fetchPage.mock.calls[0]?.[0]?.filter).toBe(columnFilters);
  });

  it('sends the keyset cursor when the meta declares keyset and a row is given', async () => {
    const { fetchPage, result } = setup({ isKeysetEnabled: true });

    await result.current.onLoadMore({ lastRow, limit: 50, skip: 50 });

    expect(fetchPage.mock.calls[0]?.[0]?.cursor).toStrictEqual(['shipped', 42]);
  });

  it('builds the same query from absent capability meta as from meta declaring both off', async () => {
    const absent = setup();
    await absent.result.current.onLoadMore({ lastRow, limit: 50, skip: 50 });

    const declaredOff = setup({
      isKeysetEnabled: false,
      isServerFilterEnabled: false,
    });
    await declaredOff.result.current.onLoadMore({
      lastRow,
      limit: 50,
      skip: 50,
    });

    const absentQuery = absent.fetchPage.mock.calls[0]?.[0];

    expect(absentQuery).toStrictEqual(declaredOff.fetchPage.mock.calls[0]?.[0]);
    expect(absentQuery?.cursor).toBeUndefined();
    expect(absentQuery?.filter).toBeUndefined();
  });

  it('omits the cursor on the first page even with keyset enabled', async () => {
    const { fetchPage, result } = setup({ isKeysetEnabled: true });

    await result.current.onLoadMore({ limit: 50, skip: 0 });

    expect(fetchPage.mock.calls[0]?.[0]?.cursor).toBeUndefined();
  });

  it('resolves with whatever the fetcher returns', async () => {
    const page = { data: [lastRow], hasMore: true };
    const fetchPage = vi.fn(async () => page);
    const { result } = renderHook(() =>
      useTableRoutePage<Row, Response>({ fetchPage }),
    );

    await expect(
      result.current.onLoadMore({ limit: 50, skip: 50 }),
    ).resolves.toBe(page);
  });
});
