// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { TableGroupAggregate } from './TableGroupAggregate.component';

const { useGetHasColumnFilterMock } = vi.hoisted(() => ({
  useGetHasColumnFilterMock: vi.fn(() => false),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetHasColumnFilter: useGetHasColumnFilterMock,
}));

const summary: TableGroupRowSummary = {
  aggregates: [
    { columnKey: 'total_amount', fn: 'sum', label: '1,234.00' },
    { columnKey: 'discount', fn: 'sum', label: '0.00' },
  ],
  count: 12,
  isSubtotal: false,
  path: [{ columnKey: 'order_status', label: 'Shipped' }],
};

describe('TableGroupAggregate', () => {
  afterEach(() => {
    cleanup();
    useGetHasColumnFilterMock.mockReturnValue(false);
  });

  it('renders the aggregate selected on its own column', () => {
    render(<TableGroupAggregate columnKey='total_amount' summary={summary} />);

    expect(screen.getByText('1,234.00')).toBeTruthy();
  });

  it('renders a genuine zero as a value, not as an absence', () => {
    // The discriminating case for the dash: a `sum()` of `0.00` over a group
    // with no discounts is a computed number, and must not read like a column
    // nobody asked for an aggregate on.
    render(<TableGroupAggregate columnKey='discount' summary={summary} />);

    expect(screen.getByText('0.00')).toBeTruthy();
    expect(screen.queryByTestId('table-group-aggregate-absent')).toBeNull();
  });

  it('renders a dash with a spoken equivalent where none was selected', () => {
    render(<TableGroupAggregate columnKey='customer_name' summary={summary} />);

    const absent = screen.getByTestId('table-group-aggregate-absent');

    expect(absent.textContent).toContain('—');
    // The glyph alone may or may not be announced depending on the reader's
    // punctuation verbosity, so the state is carried by text beside it.
    expect(absent.textContent).toContain('No aggregate');
  });

  it('marks an aggregate whose column carries an active filter', () => {
    // A WHERE filter runs before aggregation, so the total covers the rows the
    // filter left — correct SQL, and a number that lies by omission unless the
    // cell says so.
    useGetHasColumnFilterMock.mockReturnValue(true);

    render(<TableGroupAggregate columnKey='total_amount' summary={summary} />);

    expect(screen.getByTestId('table-group-aggregate-filtered')).toBeTruthy();
    expect(
      screen.getByTestId('table-group-aggregate-filtered').textContent,
    ).toContain('filtered rows only');
  });

  it('leaves an unfiltered column unmarked', () => {
    render(<TableGroupAggregate columnKey='total_amount' summary={summary} />);

    expect(screen.queryByTestId('table-group-aggregate-filtered')).toBeNull();
  });

  it('asks about its own column, not about the table', () => {
    render(<TableGroupAggregate columnKey='total_amount' summary={summary} />);

    expect(useGetHasColumnFilterMock).toHaveBeenCalledWith('total_amount');
  });
});
