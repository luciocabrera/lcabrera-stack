// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TableBodyCell } from './TableBodyCell.component';

afterEach(cleanup);

describe('TableBodyCell', () => {
  it('renders text value in a td element', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableBodyCell label='Name' value='Alice' />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('Alice').textContent).toBe('Alice');
  });

  it('renders custom children when provided', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableBodyCell label='Status' value='active'>
              <strong>Custom content</strong>
            </TableBodyCell>
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('Custom content').textContent).toBe(
      'Custom content',
    );
  });

  it('renders a td element', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableBodyCell label='Amount' value={42} />
          </tr>
        </tbody>
      </table>,
    );

    const cell = screen.getByText('42').closest('td');
    expect(cell?.tagName).toBe('TD');
  });

  it('renders the shimmer overlay when loading state is passed in', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableBodyCell isLoadingState label='Amount' value={42} />
          </tr>
        </tbody>
      </table>,
    );

    const cell = screen.getByText('42').closest('td');
    expect(cell?.querySelector('div')).toBeTruthy();
  });
});
