// @vitest-environment jsdom

import type { PaginatedQuery } from '@lcabrera/api/http/http.types';
import type { ReactNode } from 'react';

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type { TableLockedFilters } from '#ui/components/Table/Table.types';

import type { TableGroupPageQuery } from './TableGroupDetailsView.types';

import { TableGroupDetailsView } from './TableGroupDetailsView.component';

type ModalStubProps = {
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly title?: string;
};

type Page = { readonly data: readonly Row[]; readonly hasMore: boolean };

type Row = { readonly id: number };

const { routeViewMock } = vi.hoisted(() => ({ routeViewMock: vi.fn() }));

vi.mock('#ui/components/Modal', () => ({
  Modal: ({ children, onClose, title }: ModalStubProps) => (
    <section aria-label={title}>
      <button onClick={onClose} type='button'>
        Close
      </button>
      {children}
    </section>
  ),
}));

vi.mock('#ui/components/TableRouteView/TableRouteView.component', () => ({
  TableRouteView: (props: {
    readonly fetchPage: (query: PaginatedQuery) => Promise<Page>;
  }) => {
    routeViewMock(props);
    return <div data-testid='route-view' />;
  },
}));

afterEach(cleanup);

const fetchPage = vi.fn<(query: TableGroupPageQuery) => Promise<Page>>(
  async () => ({ data: [], hasMore: false }),
);

beforeEach(() => {
  fetchPage.mockClear();
  routeViewMock.mockClear();
});

const LOCKED: TableLockedFilters = {
  entries: [{ columnKey: 'status', label: 'Status', value: 'Open' }],
};

type RenderArgs = {
  readonly lockedFilters?: TableLockedFilters;
  readonly search: string;
};

const renderAt = ({ lockedFilters, search }: RenderArgs) => {
  const router = createMemoryRouter(
    [
      { element: <p>closed</p>, path: '/' },
      {
        element: (
          <TableGroupDetailsView<Row, Page>
            closePath='/'
            fetchPage={fetchPage}
          />
        ),
        loader: () => ({ metaState: { lockedFilters } }),
        path: '/group',
      },
    ],
    { initialEntries: [`/group${search}`] },
  );

  render(<RouterProvider router={router} />);

  return router;
};

const lastFetchPage = () => {
  const props = routeViewMock.mock.calls.at(-1)?.[0] as
    | undefined
    | { readonly fetchPage: (query: PaginatedQuery) => Promise<Page> };
  if (props === undefined) throw new Error('the view was never rendered');
  return props.fetchPage;
};

describe('TableGroupDetailsView', () => {
  it('titles the dialog with the group it opened on', async () => {
    renderAt({ lockedFilters: LOCKED, search: '?group=token' });

    expect(await screen.findByLabelText('Status: Open')).toBeDefined();
  });

  it('falls back to the given title when the loader states no group', async () => {
    renderAt({ search: '?group=token' });

    expect(await screen.findByLabelText('Group')).toBeDefined();
  });

  it('reads every page of the group the URL names', async () => {
    renderAt({ search: '?group=token' });
    await screen.findByTestId('route-view');

    await lastFetchPage()({ limit: 25, skip: 50 });

    expect(fetchPage).toHaveBeenCalledWith({
      group: 'token',
      limit: 25,
      skip: 50,
    });
  });

  it('closes to the given path, dropping the group and its nested view state', async () => {
    const router = renderAt({
      search: '?group=token&nested.sorting=x&sorting=y',
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
    expect(router.state.location.search).toBe('?sorting=y');
  });
});
