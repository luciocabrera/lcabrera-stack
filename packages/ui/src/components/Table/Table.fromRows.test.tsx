// @vitest-environment jsdom

import type { ReactNode } from 'react';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { AppProviders } from '#ui/components/AppProviders';
import { PERSIST_COOKIE_ACTION } from '#ui/constants/globalSettings.constants';

import type { TableColumn } from './Table.types';

import { FiltersDataProvider } from './contexts/FiltersData';
import { TableConfigProvider } from './contexts/TableConfig';
import { TablePersistenceContext } from './contexts/TableConfig/TablePersistenceContext.context';
import { TableFocusProvider } from './contexts/TableFocus';
import { Table } from './Table.component';
import { TableLayout } from './TableLayout';
import { createEmptyColumnsState } from './utils/createEmptyColumnsState.util';

type Order = {
  readonly orderTotal: number;
  readonly placedOn: string;
  readonly reference: string;
};

const ORDERS: readonly Order[] = [
  { orderTotal: 20, placedOn: '2024-03-02', reference: 'Beta' },
  { orderTotal: 5, placedOn: '2024-01-15', reference: 'Alpha' },
  { orderTotal: 12, placedOn: '2024-02-20', reference: 'Gamma' },
];

beforeAll(() => {
  Object.assign(HTMLElement.prototype, {
    hidePopover: () => {},
    scrollTo: () => {},
    showPopover: () => {},
  });
  Object.assign(HTMLDialogElement.prototype, {
    close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
    showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
});

afterEach(cleanup);

const columnValues = (columnKey: keyof Order) =>
  screen
    .getAllByRole('gridcell')
    .filter((cell) => cell.dataset.columnKey === columnKey)
    .map((cell) => cell.textContent);

const openColumnActions = (label: string) => {
  fireEvent.click(
    screen.getByRole('button', { name: `${label} column actions` }),
  );
};

const settle = () => act(async () => {});

const RerenderingParent = () => {
  const [renderCount, setRenderCount] = useState(0);

  return (
    <>
      <button
        onClick={() => {
          setRenderCount((count) => count + 1);
        }}
        type='button'
      >
        Re-render
      </button>
      <output data-testid='render-count'>{renderCount}</output>
      <Table
        columns={[{ dataType: 'string', key: 'reference', label: 'Reference' }]}
        rows={ORDERS}
      />
    </>
  );
};

const filterReference = async (value: string) => {
  openColumnActions('Reference');
  fireEvent.click(screen.getByText('Manage Column'));
  await settle();
  fireEvent.click(screen.getByRole('tab', { name: 'Filter' }));
  await settle();
  fireEvent.change(screen.getByPlaceholderText('Enter text...'), {
    target: { value },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
  await settle();
};

describe('Table from rows alone', () => {
  it('renders the rows with headers inferred from their keys, with no columns, providers or router', () => {
    render(<Table rows={ORDERS} />);

    expect(
      screen
        .getAllByTestId('table-header-label')
        .map((label) => label.textContent),
    ).toStrictEqual(['Order Total', 'Placed On', 'Reference']);
    expect(columnValues('reference')).toStrictEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('renders the columns it is given instead of inferring them', () => {
    render(
      <Table columns={[{ key: 'reference', label: 'Ref' }]} rows={ORDERS} />,
    );

    expect(
      screen
        .getAllByTestId('table-header-label')
        .map((label) => label.textContent),
    ).toStrictEqual(['Ref']);
  });

  it('reorders the rendered rows when a column is sorted outside a router', async () => {
    render(<Table rows={ORDERS} />);

    openColumnActions('Order Total');
    fireEvent.click(screen.getByText('Descending'));
    await settle();

    expect(columnValues('reference')).toStrictEqual(['Beta', 'Gamma', 'Alpha']);

    openColumnActions('Order Total');
    fireEvent.click(screen.getByText('Ascending'));
    await settle();

    expect(columnValues('reference')).toStrictEqual(['Alpha', 'Gamma', 'Beta']);
  });

  it('keeps a sort and a filter when the parent re-renders with new inline columns', async () => {
    render(<RerenderingParent />);
    const rerenderParent = async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Re-render' }));
      await settle();
    };

    openColumnActions('Reference');
    fireEvent.click(screen.getByText('Descending'));
    await settle();
    await rerenderParent();

    expect(columnValues('reference')).toStrictEqual(['Gamma', 'Beta', 'Alpha']);

    await filterReference('Beta');
    await rerenderParent();

    expect(screen.getByTestId('render-count').textContent).toBe('2');
    expect(columnValues('reference')).toStrictEqual(['Beta']);
  });

  it('restores the given order when the sort is cleared', async () => {
    render(<Table rows={ORDERS} />);

    openColumnActions('Reference');
    fireEvent.click(screen.getByText('Ascending'));
    await settle();

    expect(columnValues('reference')).toStrictEqual(['Alpha', 'Beta', 'Gamma']);

    openColumnActions('Reference');
    fireEvent.click(screen.getByText('Clear Sorting'));
    await settle();

    expect(columnValues('reference')).toStrictEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('narrows the rendered rows when a column is filtered outside a router', async () => {
    render(<Table rows={ORDERS} />);

    await filterReference('Gamma');

    expect(columnValues('reference')).toStrictEqual(['Gamma']);
  });

  it('opens the table settings with no app providers above it', async () => {
    render(<Table rows={ORDERS} />);

    fireEvent.click(screen.getByRole('button', { name: 'Table settings' }));
    await settle();

    expect(screen.getAllByRole('tab').length).toBeGreaterThan(0);
  });

  it('offers no grouping, which needs a server, from the column menu or the settings', async () => {
    render(<Table rows={ORDERS} />);

    openColumnActions('Reference');
    await settle();

    expect(screen.getByText('Ascending')).not.toBeNull();
    expect(screen.queryByText('Group by This')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Table settings' }));
    await settle();

    expect(
      screen.getAllByRole('tab').map((tab) => tab.textContent),
    ).not.toContain('Grouping');
    expect(
      screen.getByTestId('table-scroll-container').dataset.scrollLocked,
    ).toBe('false');
  });

  it('shows the empty state, with nothing to retry, when a filter matches no row', async () => {
    render(<Table rows={ORDERS} />);

    await filterReference('Delta');

    expect(screen.queryAllByRole('gridcell')).toStrictEqual([]);
    expect(
      screen.getByText(/No records match the current view/),
    ).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
});

const COLUMNS: readonly TableColumn<Order>[] = [
  { key: 'reference', label: 'Reference' },
];

type RecordSubmissionArgs = {
  readonly request: Request;
  readonly submissions: string[];
};

const recordSubmission = async ({
  request,
  submissions,
}: RecordSubmissionArgs) => {
  const formData = await request.formData();
  const entries = formData.get('entries');

  submissions.push(typeof entries === 'string' ? entries : '');

  return { ok: true };
};

const renderRoute = async (element: ReactNode) => {
  const submissions: string[] = [];
  const router = createMemoryRouter([
    { element: <AppProviders>{element}</AppProviders>, path: '/' },
    {
      action: async ({ request }) => recordSubmission({ request, submissions }),
      path: PERSIST_COOKIE_ACTION,
    },
  ]);

  await act(async () => {
    render(<RouterProvider router={router} />);
    await Promise.resolve();
  });

  return submissions;
};

describe('Table given rows inside another grid', () => {
  const ENCLOSING_COLUMNS: readonly TableColumn<Order>[] = [
    { key: 'orderTotal', label: 'Enclosing Total' },
  ];
  const ENCLOSING_PERSISTENCE = {
    columnSizing: vi.fn(),
    tableState: vi.fn(),
    uiFlags: vi.fn(),
  };

  const renderInsideEnclosingGrid = () =>
    render(
      <TablePersistenceContext value={ENCLOSING_PERSISTENCE}>
        <TableConfigProvider<Order>
          columnsState={{
            ...createEmptyColumnsState({ columns: ENCLOSING_COLUMNS }),
            sorting: [{ columnKey: 'orderTotal', direction: 'desc' }],
          }}
        >
          <TableFocusProvider>
            <FiltersDataProvider<Order> columns={[...ENCLOSING_COLUMNS]}>
              <Table columns={COLUMNS} rows={ORDERS} title='Inner' />
            </FiltersDataProvider>
          </TableFocusProvider>
        </TableConfigProvider>
      </TablePersistenceContext>,
    );

  it('renders its own columns, in the given order, ignoring the enclosing grid', () => {
    renderInsideEnclosingGrid();

    expect(
      screen
        .getAllByTestId('table-header-label')
        .map((label) => label.textContent),
    ).toStrictEqual(['Reference']);
    expect(columnValues('reference')).toStrictEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('sorts in memory without submitting through the enclosing grid', async () => {
    renderInsideEnclosingGrid();

    openColumnActions('Reference');
    fireEvent.click(screen.getByText('Ascending'));
    await settle();

    expect(columnValues('reference')).toStrictEqual(['Alpha', 'Beta', 'Gamma']);
    expect(ENCLOSING_PERSISTENCE.tableState).not.toHaveBeenCalled();
  });
});

describe('Table persistence inside a router', () => {
  it('submits a sort to the cookie action from the route-level layout', async () => {
    const dataPromise = Promise.resolve({ data: ORDERS });
    const submissions = await renderRoute(
      <TableLayout<Order, { readonly data: readonly Order[] }>
        columnsState={createEmptyColumnsState({ columns: COLUMNS })}
        dataPromise={dataPromise}
        dataSelector={(page) => page.data}
        metaState={{ persistenceKey: 'orders' }}
      />,
    );

    await screen.findByText('Beta');
    openColumnActions('Reference');
    fireEvent.click(screen.getByText('Ascending'));

    await waitFor(() => {
      expect(submissions).toHaveLength(1);
    });
    expect(submissions[0]).toContain('"searchParamKey":"sorting"');
  });

  it('keeps a Table given rows in memory, submitting nothing', async () => {
    const submissions = await renderRoute(
      <Table columns={COLUMNS} rows={ORDERS} />,
    );

    openColumnActions('Reference');
    fireEvent.click(screen.getByText('Ascending'));
    await settle();

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    });

    expect(columnValues('reference')).toStrictEqual(['Alpha', 'Beta', 'Gamma']);
    expect(submissions).toStrictEqual([]);
  });
});
