// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { useGetTableIsLoadingMock, useGetTableIsLoadingMoreMock } = vi.hoisted(
  () => ({
    useGetTableIsLoadingMock: vi.fn(),
    useGetTableIsLoadingMoreMock: vi.fn(),
  }),
);

vi.mock('@/components/Table/contexts/TableData/data/selectors', () => ({
  useGetTableIsLoading: useGetTableIsLoadingMock,
  useGetTableIsLoadingMore: useGetTableIsLoadingMoreMock,
}));

import { TableBodyCell } from './TableBodyCell.component';

describe('TableBodyCell', () => {
  it('renders text value in a td element', () => {
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);

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
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);

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
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);

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
});
