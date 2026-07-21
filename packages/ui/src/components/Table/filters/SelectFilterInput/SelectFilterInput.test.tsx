// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TableColumn } from '../../Table.types';

import { FILTER_OPTIONS_TIMEOUT_MS } from '../../Table.constants';
import { SelectFilterInput } from './SelectFilterInput.component';

afterEach(cleanup);

type Row = { readonly status: string };

const {
  fetchDistinctValuesMock,
  fetchInitialMock,
  fetchMoreMock,
  normalizedColumnMock,
} = vi.hoisted(() => ({
  fetchDistinctValuesMock: vi.fn(),
  fetchInitialMock: vi.fn(),
  fetchMoreMock: vi.fn(),
  normalizedColumnMock: vi.fn(),
}));

const MockVirtualSelect = vi.hoisted(() => {
  return function MockVirtualSelect({
    onFetchInitial,
    onFetchMore,
  }: {
    readonly onFetchInitial?: () => Promise<void> | void;
    readonly onFetchMore?: () => Promise<void> | void;
  }) {
    return (
      <div>
        <button
          onClick={() => {
            void onFetchInitial?.();
          }}
          type='button'
        >
          trigger-initial
        </button>
        <button
          onClick={() => {
            void onFetchMore?.();
          }}
          type='button'
        >
          trigger-more
        </button>
      </div>
    );
  };
});

vi.mock('@lcabrera/api/distinct/fetch-distinct-values.util', () => ({
  fetchDistinctValues: fetchDistinctValuesMock,
}));
vi.mock('@lcabrera/api/config/get-api-base-url.util', () => ({
  getApiBaseUrl: vi.fn(() => '/api'),
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetNormalizedColumn: normalizedColumnMock,
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/FiltersData/filters/selectors',
  () => ({
    useGetFilterData: vi.fn(() => ({
      data: [],
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows: 0,
      totalRows: 0,
    })),
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/FiltersData/filters/actions',
  () => ({
    useFetchFilterData: vi.fn(() => ({
      fetchInitial: fetchInitialMock,
      fetchMore: fetchMoreMock,
    })),
  }),
);

vi.mock('@lcabrera/ui/components/VirtualSelect', () => ({
  VirtualSelect: MockVirtualSelect,
}));

const renderWithColumn = (column: TableColumn<Row>) => {
  normalizedColumnMock.mockReturnValue(column);
  render(
    <SelectFilterInput<Row>
      columnKey='status'
      filter={undefined}
      onChange={vi.fn()}
    />,
  );
};

describe('SelectFilterInput', () => {
  beforeEach(() => {
    fetchInitialMock.mockReset();
    fetchMoreMock.mockReset();
    fetchDistinctValuesMock.mockReset();
  });

  it('resolves a static descriptor into a slicing executor for the initial fetch', async () => {
    renderWithColumn({
      dataType: 'string',
      filterOptionsDescriptor: { kind: 'static', values: ['Open', 'Closed'] },
      key: 'status',
      label: 'Status',
    });

    fireEvent.click(screen.getByRole('button', { name: 'trigger-initial' }));

    expect(fetchInitialMock).toHaveBeenCalledTimes(1);
    const [executor] = fetchInitialMock.mock.calls[0] as [
      {
        readonly onLoadMore: (page: {
          readonly limit: number;
          readonly skip: number;
        }) => Promise<{ readonly values: string[] }>;
      },
    ];
    const page = await executor.onLoadMore({ limit: 1, skip: 1 });
    expect(page.values).toEqual(['Closed']);
  });

  it('resolves a distinct descriptor into a fetching executor for fetch-more', async () => {
    fetchDistinctValuesMock.mockResolvedValue({
      hasMore: false,
      values: ['Pending'],
    });

    renderWithColumn({
      dataType: 'string',
      filterOptionsDescriptor: {
        kind: 'distinct',
        params: {
          columnName: 'status',
          schemaName: 'public',
          tableName: 'orders',
        },
        transport: 'bff',
      },
      key: 'status',
      label: 'Status',
    });

    fireEvent.click(screen.getByRole('button', { name: 'trigger-more' }));

    expect(fetchMoreMock).toHaveBeenCalledTimes(1);
    const [executor] = fetchMoreMock.mock.calls[0] as [
      {
        readonly onLoadMore: (page: {
          readonly limit: number;
          readonly skip: number;
        }) => Promise<unknown>;
      },
    ];
    await executor.onLoadMore({ limit: 50, skip: 50 });

    expect(fetchDistinctValuesMock).toHaveBeenCalledWith({
      baseUrl: '/api/distinct',
      columnName: 'status',
      limit: 50,
      offset: 50,
      schemaName: 'public',
      tableName: 'orders',
      timeoutMs: FILTER_OPTIONS_TIMEOUT_MS,
    });
  });

  it('skips fetching entirely when the column has no descriptor', () => {
    renderWithColumn({ dataType: 'string', key: 'status', label: 'Status' });

    fireEvent.click(screen.getByRole('button', { name: 'trigger-initial' }));
    fireEvent.click(screen.getByRole('button', { name: 'trigger-more' }));

    expect(fetchInitialMock).not.toHaveBeenCalled();
    expect(fetchMoreMock).not.toHaveBeenCalled();
  });
});
