// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { TableBase } from './TableBase.component';

const {
  useGetTableDensityMock,
  useGetTableIsBorderedMock,
  useGetTableIsLoadingMock,
  useGetTableIsStripedMock,
  useGetTableTotalRowsMock,
  useSyncTableGroupExpansionMock,
  useTableGridFocusMock,
  useTableGroupTreeMock,
} = vi.hoisted(() => ({
  useGetTableDensityMock: vi.fn(),
  useGetTableIsBorderedMock: vi.fn(),
  useGetTableIsLoadingMock: vi.fn(),
  useGetTableIsStripedMock: vi.fn(),
  useGetTableTotalRowsMock: vi.fn(),
  useSyncTableGroupExpansionMock: vi.fn(),
  useTableGridFocusMock: vi.fn(),
  useTableGroupTreeMock: vi.fn(),
}));

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTableDensity: useGetTableDensityMock,
  useGetTableIsBordered: useGetTableIsBorderedMock,
  useGetTableIsStriped: useGetTableIsStripedMock,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableIsLoading: useGetTableIsLoadingMock,
  useGetTableTotalRows: useGetTableTotalRowsMock,
}));

// The focus wiring is exercised end to end in Table.gridFocus.test.tsx, against
// a real provider stack and a real virtualization window. Stubbing it here keeps
// this suite about the element TableBase renders.
vi.mock('#ui/components/Table/hooks', () => ({
  useSyncTableGroupExpansion: useSyncTableGroupExpansionMock,
  useTableGridFocus: useTableGridFocusMock,
  useTableGroupTree: useTableGroupTreeMock,
}));

afterEach(() => {
  cleanup();
});

describe('TableBase', () => {
  beforeEach(() => {
    useGetTableDensityMock.mockReturnValue('comfortable');
    useGetTableIsBorderedMock.mockReturnValue(true);
    useGetTableIsStripedMock.mockReturnValue(false);
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableTotalRowsMock.mockReturnValue(0);
    useTableGridFocusMock.mockReturnValue({ tabIndex: 0 });
    useTableGroupTreeMock.mockReturnValue({
      isTreeGrid: false,
      rowMeta: undefined,
      rows: [],
    });
  });

  it('renders children inside a table element', () => {
    render(
      <TableBase>
        <tbody>
          <tr>
            <td>Orders</td>
          </tr>
        </tbody>
      </TableBase>,
    );

    const table = screen.getByTestId('table');
    expect(table.tagName).toBe('TABLE');
    expect(screen.getByText('Orders').textContent).toBe('Orders');
  });

  it('reflects striped state via data attribute', () => {
    useGetTableIsStripedMock.mockReturnValue(true);

    render(
      <TableBase>
        <tbody>
          <tr>
            <td>Striped</td>
          </tr>
        </tbody>
      </TableBase>,
    );

    const table = screen.getByTestId('table');
    expect(table.dataset.striped).toBe('true');
  });

  it('declares role=grid, because the display overrides removed the implicit one', () => {
    render(
      <TableBase>
        <tbody>
          <tr>
            <td>Orders</td>
          </tr>
        </tbody>
      </TableBase>,
    );

    expect(screen.getByRole('grid')).toBe(screen.getByTestId('table'));
  });

  it('reports aria-rowcount as the dataset plus its header row', () => {
    useGetTableTotalRowsMock.mockReturnValue(120);

    render(
      <TableBase>
        <tbody>
          <tr>
            <td>Orders</td>
          </tr>
        </tbody>
      </TableBase>,
    );

    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('121');
  });

  it('reports a resolved empty grid as holding exactly its header row', () => {
    // A filter matching nothing is an ordinary outcome and the count is known.
    useGetTableTotalRowsMock.mockReturnValue(0);
    useGetTableIsLoadingMock.mockReturnValue(false);

    render(
      <TableBase>
        <tbody>
          <tr>
            <td>Orders</td>
          </tr>
        </tbody>
      </TableBase>,
    );

    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('1');
  });

  it('reports an unknown aria-rowcount only while the data has not resolved', () => {
    useGetTableTotalRowsMock.mockReturnValue(0);
    useGetTableIsLoadingMock.mockReturnValue(true);

    render(
      <TableBase>
        <tbody>
          <tr>
            <td>Orders</td>
          </tr>
        </tbody>
      </TableBase>,
    );

    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('-1');
  });

  it('keeps its ARIA contract when a caller passes conflicting props', () => {
    // The role and the row count are the grid's only source of those semantics
    // once CSS has stripped the implicit ones, so `{...rest}` must not be able
    // to replace them. Revert the spread order and this is what fails.
    useGetTableTotalRowsMock.mockReturnValue(120);

    render(
      <TableBase aria-rowcount={7} role='table'>
        <tbody>
          <tr>
            <td>Orders</td>
          </tr>
        </tbody>
      </TableBase>,
    );

    const grid = screen.getByTestId('table');
    expect(grid.getAttribute('role')).toBe('grid');
    expect(grid.getAttribute('aria-rowcount')).toBe('121');
  });

  it('upgrades to role=treegrid, and counts the rows a collapse leaves standing', () => {
    // The two move together on purpose: a treegrid's rows *are* the visible
    // ones, so a count taken from the dataset would advertise more rows than
    // the body can ever emit an `aria-rowindex` for (ADR-067).
    useGetTableTotalRowsMock.mockReturnValue(120);
    useTableGroupTreeMock.mockReturnValue({
      isTreeGrid: true,
      rowMeta: [],
      rows: [{}, {}, {}],
    });

    render(
      <TableBase>
        <tbody>
          <tr>
            <td>Orders</td>
          </tr>
        </tbody>
      </TableBase>,
    );

    const grid = screen.getByTestId('table');
    expect(grid.getAttribute('role')).toBe('treegrid');
    expect(grid.getAttribute('aria-rowcount')).toBe('4');
  });

  it('forwards native table attributes', () => {
    render(
      <TableBase title='orders-table'>
        <tbody>
          <tr>
            <td>Summary</td>
          </tr>
        </tbody>
      </TableBase>,
    );

    const table = screen.getByTitle('orders-table');
    expect(table.tagName).toBe('TABLE');
  });
});
