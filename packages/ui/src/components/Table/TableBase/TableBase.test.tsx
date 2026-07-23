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
} = vi.hoisted(() => ({
  useGetTableDensityMock: vi.fn(),
  useGetTableIsBorderedMock: vi.fn(),
  useGetTableIsStripedMock: vi.fn(),
}));

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTableDensity: useGetTableDensityMock,
  useGetTableIsBordered: useGetTableIsBorderedMock,
  useGetTableIsStriped: useGetTableIsStripedMock,
}));

afterEach(() => {
  cleanup();
});

describe('TableBase', () => {
  beforeEach(() => {
    useGetTableDensityMock.mockReturnValue('comfortable');
    useGetTableIsBorderedMock.mockReturnValue(true);
    useGetTableIsStripedMock.mockReturnValue(false);
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
