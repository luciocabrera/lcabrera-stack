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
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vite-plus/test';

import { AppProviders } from '#ui/components/AppProviders';
import { PERSIST_COOKIE_ACTION } from '#ui/constants/globalSettings.constants';

import type { TableColumn, TableProps } from './Table.types';

import { FiltersDataProvider } from './contexts/FiltersData';
import { TableConfigProvider } from './contexts/TableConfig';
import { TablePersistenceContext } from './contexts/TableConfig/TablePersistenceContext.context';
import { TableFocusProvider } from './contexts/TableFocus';
import { Table } from './Table.component';
import { TableLayout } from './TableLayout';
import { createEmptyColumnsState } from './utils/createEmptyColumnsState.util';
import { inferTableColumnsFromJson } from './utils/inferTableColumnsFromJson.util';

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

const ORDER_COLUMNS: readonly TableColumn<Order>[] = [
  { dataType: 'number', key: 'orderTotal', label: 'Order Total' },
  { dataType: 'date', key: 'placedOn', label: 'Placed On' },
  { dataType: 'string', key: 'reference', label: 'Reference' },
];

type OrderPage = {
  readonly data: readonly Order[];
  readonly total: number;
};

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

const headerLabels = () =>
  screen.getAllByTestId('table-header-label').map((label) => label.textContent);

const gridAncestorClasses = () => {
  const classes: string[] = [];

  for (
    let node = screen.getByTestId('table-scroll-container').parentElement;
    node !== null && node !== document.body;
    node = node.parentElement
  ) {
    classes.push(node.className);
  }

  return classes;
};

type UnwrappedOrdersProps = {
  readonly response: Promise<readonly Order[]> | readonly Order[];
};

const UnwrappedOrders = ({ response }: UnwrappedOrdersProps) => (
  <Table
    columns={ORDER_COLUMNS}
    icon={<span data-testid='table-icon' />}
    isFlexWrapperEnabled={false}
    response={response}
    title='Orders'
  />
);

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
        response={ORDERS}
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

describe('Table from a plain array or a promise', () => {
  it('renders a plain array with the columns it is given, with no providers or router', () => {
    render(<Table columns={ORDER_COLUMNS} response={ORDERS} />);

    expect(headerLabels()).toStrictEqual([
      'Order Total',
      'Placed On',
      'Reference',
    ]);
    expect(columnValues('reference')).toStrictEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('renders the same rows from a promise of that array', async () => {
    await act(async () => {
      render(
        <Table columns={ORDER_COLUMNS} response={Promise.resolve(ORDERS)} />,
      );
    });

    expect(headerLabels()).toStrictEqual([
      'Order Total',
      'Placed On',
      'Reference',
    ]);
    expect(columnValues('reference')).toStrictEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('keeps the caller’s props on the loading grid while the promise is pending', async () => {
    const pending = new Promise<readonly Order[]>(() => undefined);

    await act(async () => {
      render(<UnwrappedOrders response={pending} />);
    });
    const pendingLayout = gridAncestorClasses();
    const pendingIcons = screen.queryAllByTestId('table-icon').length;

    cleanup();
    render(<UnwrappedOrders response={ORDERS} />);

    expect(pendingIcons).toBe(1);
    expect(pendingLayout).toStrictEqual(gridAncestorClasses());
  });

  it('shows a loading grid with its columns while the promise is pending', async () => {
    const pending = new Promise<readonly Order[]>(() => undefined);

    await act(async () => {
      render(<Table columns={ORDER_COLUMNS} response={pending} />);
    });

    expect(headerLabels()).toStrictEqual([
      'Order Total',
      'Placed On',
      'Reference',
    ]);
    expect(
      screen.getByTestId('table-scroll-container').dataset.scrollLocked,
    ).toBe('true');
  });

  it('reads a promised response through its selectors', async () => {
    await act(async () => {
      render(
        <Table
          columns={ORDER_COLUMNS}
          dataSelector={(page: OrderPage) => page.data}
          dataTotalSelector={(page: OrderPage) => page.total}
          response={Promise.resolve({ data: ORDERS, total: 3 })}
        />,
      );
    });

    expect(columnValues('reference')).toStrictEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('renders columns a caller inferred from the rows', () => {
    const rows: readonly Record<string, unknown>[] = ORDERS;

    render(
      <Table columns={inferTableColumnsFromJson({ rows })} response={rows} />,
    );

    expect(headerLabels()).toStrictEqual([
      'Order Total',
      'Placed On',
      'Reference',
    ]);
  });

  it('requires the columns', () => {
    expectTypeOf<
      Record<never, never> extends Pick<TableProps<Order, unknown>, 'columns'>
        ? 'optional'
        : 'required'
    >().toEqualTypeOf<'required'>();
  });

  it('reorders the rendered rows when a column is sorted outside a router', async () => {
    render(<Table columns={ORDER_COLUMNS} response={ORDERS} />);

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
    render(<Table columns={ORDER_COLUMNS} response={ORDERS} />);

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
    render(<Table columns={ORDER_COLUMNS} response={ORDERS} />);

    await filterReference('Gamma');

    expect(columnValues('reference')).toStrictEqual(['Gamma']);
  });

  it('opens the table settings with no app providers above it', async () => {
    render(<Table columns={ORDER_COLUMNS} response={ORDERS} />);

    fireEvent.click(screen.getByRole('button', { name: 'Table settings' }));
    await settle();

    expect(screen.getAllByRole('tab').length).toBeGreaterThan(0);
  });

  it('offers no grouping, which needs a server, from the column menu or the settings', async () => {
    render(<Table columns={ORDER_COLUMNS} response={ORDERS} />);

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
    render(<Table columns={ORDER_COLUMNS} response={ORDERS} />);

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
              <Table columns={COLUMNS} response={ORDERS} title='Inner' />
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
      <Table columns={COLUMNS} response={ORDERS} />,
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
