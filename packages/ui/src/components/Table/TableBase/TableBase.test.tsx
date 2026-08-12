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
  useGetTableIsStripedMock,
  useGetTableTotalRowsMock,
  useTableGridFocusMock,
} = vi.hoisted(() => ({
  useGetTableDensityMock: vi.fn(),
  useGetTableIsBorderedMock: vi.fn(),
  useGetTableIsStripedMock: vi.fn(),
  useGetTableTotalRowsMock: vi.fn(),
  useTableGridFocusMock: vi.fn(),
}));

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTableDensity: useGetTableDensityMock,
  useGetTableIsBordered: useGetTableIsBorderedMock,
  useGetTableIsStriped: useGetTableIsStripedMock,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableTotalRows: useGetTableTotalRowsMock,
}));

// The focus wiring is exercised end to end in Table.gridFocus.test.tsx, against
// a real provider stack and a real virtualization window. Stubbing it here keeps
// this suite about the element TableBase renders.
vi.mock('#ui/components/Table/hooks', () => ({
  useTableGridFocus: useTableGridFocusMock,
}));

afterEach(() => {
  cleanup();
});

describe('TableBase', () => {
  beforeEach(() => {
    useGetTableDensityMock.mockReturnValue('comfortable');
    useGetTableIsBorderedMock.mockReturnValue(true);
    useGetTableIsStripedMock.mockReturnValue(false);
    useGetTableTotalRowsMock.mockReturnValue(0);
    useTableGridFocusMock.mockReturnValue({ tabIndex: 0 });
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

  it('reports an unknown aria-rowcount when the consumer supplied no total', () => {
    useGetTableTotalRowsMock.mockReturnValue(0);

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
