// @vitest-environment jsdom

import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table';
import type { TableLayoutProps } from '#ui/components/Table/TableLayout/TableLayout.types';

import { TableRouteView } from './TableRouteView.component';

type Response = {
  readonly data: readonly Row[];
  readonly hasMore: boolean;
  readonly total?: number;
};

type Row = {
  readonly order_id: number;
  readonly order_status: string;
};

const { tableLayoutMock, useLoaderDataMock } = vi.hoisted(() => ({
  tableLayoutMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
}));

vi.mock('react-router', () => ({ useLoaderData: useLoaderDataMock }));

vi.mock('#ui/components/Table/TableLayout', () => ({
  TableLayout: (props: TableLayoutProps<Row, Response>) => {
    tableLayoutMock(props);
    return <div data-testid='table-layout' />;
  },
}));

const columns: TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'order_id', label: 'order_id' },
];

const dataPromise = Promise.resolve<Response>({ data: [], hasMore: false });
const metaState = { title: 'Orders' };

const loaderData = {
  columnsState: {
    columnFilters: {},
    columnOrder: [],
    columnPinning: { left: [], right: [] },
    columns,
    columnSizing: {},
    columnVisibility: new Set(),
    sorting: [],
  },
  dataPromise,
  key: '',
  metaState,
};

/** The props the mocked `TableLayout` last received. */
const lastProps = () =>
  tableLayoutMock.mock.calls.at(-1)?.[0] as TableLayoutProps<Row, Response>;

/** Typed with the real fetcher signature so assertions can read the built query. */
const fetchPage = vi.fn<(query: PaginatedQuery) => Promise<Response>>(
  async () => ({ data: [], hasMore: false }),
);

beforeEach(() => {
  tableLayoutMock.mockClear();
  fetchPage.mockClear();
  useLoaderDataMock.mockReset();
  useLoaderDataMock.mockReturnValue(loaderData);
});

afterEach(cleanup);

describe('TableRouteView', () => {
  it('forwards the loader state to TableLayout', () => {
    render(<TableRouteView<Row, Response> fetchPage={fetchPage} />);

    const props = lastProps();
    expect(props.columnsState).toBe(loaderData.columnsState);
    expect(props.dataPromise).toBe(dataPromise);
    expect(props.metaState).toBe(metaState);
  });

  it('defaults dataSelector to the response rows', () => {
    render(<TableRouteView<Row, Response> fetchPage={fetchPage} />);

    const rows = [{ order_id: 1, order_status: 'new' }];
    expect(
      lastProps().dataSelector?.({ data: rows, hasMore: false }),
    ).toStrictEqual(rows);
  });

  it('defaults dataTotalSelector to the response total', () => {
    render(<TableRouteView<Row, Response> fetchPage={fetchPage} />);

    expect(
      lastProps().dataTotalSelector?.({ data: [], hasMore: false, total: 7 }),
    ).toBe(7);
    expect(
      lastProps().dataTotalSelector?.({ data: [], hasMore: false }),
    ).toBeUndefined();
  });

  it('lets a caller override both selectors', () => {
    render(
      <TableRouteView<Row, Response>
        dataSelector={() => []}
        dataTotalSelector={() => 99}
        fetchPage={fetchPage}
      />,
    );

    expect(lastProps().dataTotalSelector?.({ data: [], hasMore: false })).toBe(
      99,
    );
  });

  it('wires onLoadMore to the supplied fetcher', async () => {
    render(<TableRouteView<Row, Response> fetchPage={fetchPage} />);

    await lastProps().onLoadMore?.({ limit: 50, skip: 50 });

    expect(fetchPage).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, skip: 50 }),
    );
  });

  it('forwards actions through to TableLayout', () => {
    render(
      <TableRouteView<Row, Response>
        actions={<button type='button'>Add</button>}
        fetchPage={fetchPage}
      />,
    );

    expect(lastProps().actions).toBeDefined();
  });

  // The view takes no capability prop at all (ADR-063), so the only way a
  // filter can reach the query is the loader meta — which is what this asserts.
  it('shapes the request from the loader meta rather than from a prop', async () => {
    useLoaderDataMock.mockReturnValue({
      ...loaderData,
      metaState: { ...metaState, isServerFilterEnabled: true },
    });
    render(<TableRouteView<Row, Response> fetchPage={fetchPage} />);

    await lastProps().onLoadMore?.({ limit: 50, skip: 50 });

    expect(fetchPage).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: loaderData.columnsState.columnFilters,
      }),
    );
  });

  it('sends no filter when the loader meta declares no capability', async () => {
    render(<TableRouteView<Row, Response> fetchPage={fetchPage} />);

    await lastProps().onLoadMore?.({ limit: 50, skip: 50 });

    expect(fetchPage.mock.calls[0]?.[0]?.filter).toBeUndefined();
  });
});
