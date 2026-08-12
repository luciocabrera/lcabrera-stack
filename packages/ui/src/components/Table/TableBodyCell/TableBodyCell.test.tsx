// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TableFocusProvider } from '#ui/components/Table/contexts/TableFocus';

import { TableBodyCell } from './TableBodyCell.component';

/**
 * A cell is a grid cell, so it reads the grid's focus store. That provider is
 * the only context it needs: pointer focus is a store write and nothing else,
 * which is what keeps a cell testable without the whole table around it.
 */
const renderCell = (children: ReactNode) =>
  render(
    <TableFocusProvider>
      <table>
        <tbody>
          <tr>{children}</tr>
        </tbody>
      </table>
    </TableFocusProvider>,
  );

afterEach(cleanup);

describe('TableBodyCell', () => {
  it('renders text value in a td element', () => {
    renderCell(
      <TableBodyCell
        columnKey='name'
        label='Name'
        rowIndex={0}
        rowKey='pk:[1]'
        value='Alice'
      />,
    );

    expect(screen.getByText('Alice').textContent).toBe('Alice');
  });

  it('renders custom children when provided', () => {
    renderCell(
      <TableBodyCell
        columnKey='status'
        label='Status'
        rowIndex={0}
        rowKey='pk:[1]'
        value='active'
      >
        <strong>Custom content</strong>
      </TableBodyCell>,
    );

    expect(screen.getByText('Custom content').textContent).toBe(
      'Custom content',
    );
  });

  it('renders a td element', () => {
    renderCell(
      <TableBodyCell
        columnKey='amount'
        label='Amount'
        rowIndex={0}
        rowKey='pk:[1]'
        value={42}
      />,
    );

    const cell = screen.getByText('42').closest('td');
    expect(cell?.tagName).toBe('TD');
  });

  it('renders the shimmer overlay when loading state is passed in', () => {
    renderCell(
      <TableBodyCell
        columnKey='amount'
        isLoadingState
        label='Amount'
        rowIndex={0}
        rowKey='pk:[1]'
        value={42}
      />,
    );

    const cell = screen.getByText('42').closest('td');
    expect(cell?.querySelector('div')).toBeTruthy();
  });

  it('declares role=gridcell and is not a tab stop until the grid focuses it', () => {
    renderCell(
      <TableBodyCell
        columnKey='amount'
        label='Amount'
        rowIndex={0}
        rowKey='pk:[1]'
        value={42}
      />,
    );

    const cell = screen.getByRole('gridcell');
    expect(cell.tagName).toBe('TD');
    expect(cell.getAttribute('tabindex')).toBe('-1');
  });
});
