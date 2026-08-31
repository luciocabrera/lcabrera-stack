// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type {
  TableColumn,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { TableGroupAggregate } from './TableGroupAggregate.component';

const { useGetHasColumnFilterMock, useGetNormalizedColumnMock } = vi.hoisted(
  () => ({
    useGetHasColumnFilterMock: vi.fn(() => false),
    useGetNormalizedColumnMock: vi.fn(),
  }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetHasColumnFilter: useGetHasColumnFilterMock,
  useGetNormalizedColumn: useGetNormalizedColumnMock,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableLocale: () => 'en-US',
}));

// The share is a delegate of this cell with its own suite; these cases are
// about the aggregate, so it is switched off rather than stubbed out — the cell
// still renders it, and it still decides for itself to render nothing.
vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableColumnShare: () => false,
}));

const COLUMNS: Record<string, TableColumn<Record<string, unknown>>> = {
  'order_count:count': {
    // Resolved by the derivation, not inherited: a tally is never money.
    dataType: 'number',
    headerGroupLabel: 'Orders',
    key: 'order_count:count',
    label: 'Count',
  },
  'total_amount:sum': {
    dataType: 'currency',
    format: { currency: { currency: 'USD', locale: 'en-US' } },
    headerGroupLabel: 'Total Amount',
    key: 'total_amount:sum',
    label: 'Sum',
  },
  'unit_price:avg': {
    dataType: 'number',
    format: { number: { maximumFractionDigits: 2, minimumFractionDigits: 2 } },
    headerGroupLabel: 'Unit Price',
    key: 'unit_price:avg',
    label: 'Average',
  },
};

const summary: TableGroupRowSummary = {
  aggregates: [
    { columnKey: 'total_amount', fn: 'sum', value: '302540833.38' },
    { columnKey: 'unit_price', fn: 'avg', value: '2503.3168000000000000' },
    { columnKey: 'order_count', fn: 'count', value: '1380' },
    { columnKey: 'discount', fn: 'sum', value: '0.00' },
  ],
  count: 12,
  isSubtotal: false,
  path: [{ columnKey: 'order_status', label: 'Shipped', value: 'Shipped' }],
};

const renderAggregate = (columnKey: string) => {
  useGetNormalizedColumnMock.mockImplementation(
    (key: unknown) => COLUMNS[key as string],
  );

  return render(
    <TableGroupAggregate columnKey={columnKey} summary={summary} />,
  );
};

describe('TableGroupAggregate', () => {
  afterEach(() => {
    cleanup();
    useGetHasColumnFilterMock.mockReturnValue(false);
    useGetNormalizedColumnMock.mockReset();
  });

  it('formats a currency column’s sum as currency', () => {
    renderAggregate('total_amount:sum');

    expect(screen.getByText(/302,540,833\.38/u)).toBeTruthy();
    expect(screen.queryByText('302540833.38')).toBeNull();
  });

  it('honours the column’s fraction digits on an average', () => {
    renderAggregate('unit_price:avg');

    expect(screen.getByText('2,503.32')).toBeTruthy();
  });

  it('renders a count as a tally even on a currency column', () => {
    renderAggregate('order_count:count');

    expect(screen.getByText('1,380')).toBeTruthy();
    expect(screen.queryByText(/\$/u)).toBeNull();
  });

  it('renders a genuine zero as a value, not as an absence', () => {
    renderAggregate('discount:sum');

    expect(screen.getByText('0.00')).toBeTruthy();
    expect(screen.queryByTestId('table-group-aggregate-absent')).toBeNull();
  });

  it('renders a dash with a spoken equivalent where none was selected', () => {
    renderAggregate('customer_name');

    const absent = screen.getByTestId('table-group-aggregate-absent');

    expect(absent.textContent).toContain('—');
    expect(absent.textContent).toContain('No aggregate');
  });

  it('marks an aggregate whose column carries an active filter', () => {
    useGetHasColumnFilterMock.mockReturnValue(true);

    renderAggregate('total_amount:sum');

    expect(screen.getByTestId('table-group-aggregate-filtered')).toBeTruthy();
    expect(
      screen.getByTestId('table-group-aggregate-filtered').textContent,
    ).toContain('filtered rows only');
  });

  it('leaves an unfiltered column unmarked', () => {
    renderAggregate('total_amount:sum');

    expect(screen.queryByTestId('table-group-aggregate-filtered')).toBeNull();
  });

  it('asks about the measured column, not about its own derived key', () => {
    renderAggregate('total_amount:sum');

    expect(useGetHasColumnFilterMock).toHaveBeenCalledWith('total_amount');
    expect(useGetHasColumnFilterMock).not.toHaveBeenCalledWith(
      'total_amount:sum',
    );
  });
});

describe('TableGroupAggregate with several measures on one column', () => {
  const multiSummary: TableGroupRowSummary = {
    aggregates: [
      { columnKey: 'total_amount', fn: 'avg', value: '2503.3168' },
      { columnKey: 'total_amount', fn: 'sum', value: '302540833.38' },
    ],
    count: 12,
    isSubtotal: false,
    path: [{ columnKey: 'order_status', label: 'Shipped', value: 'Shipped' }],
  };

  const MULTI_COLUMNS: Record<string, TableColumn<Record<string, unknown>>> = {
    'total_amount:avg': {
      dataType: 'currency',
      format: { currency: { currency: 'USD', locale: 'en-US' } },
      headerGroupLabel: 'Total Amount',
      key: 'total_amount:avg',
      label: 'Average',
    },
    'total_amount:sum': {
      dataType: 'currency',
      format: { currency: { currency: 'USD', locale: 'en-US' } },
      headerGroupLabel: 'Total Amount',
      key: 'total_amount:sum',
      label: 'Sum',
    },
  };

  const renderMeasure = (columnKey: string) => {
    useGetNormalizedColumnMock.mockImplementation(
      (key: unknown) => MULTI_COLUMNS[key as string],
    );

    return render(
      <TableGroupAggregate columnKey={columnKey} summary={multiSummary} />,
    );
  };

  afterEach(() => {
    cleanup();
    useGetHasColumnFilterMock.mockReturnValue(false);
    useGetNormalizedColumnMock.mockReset();
  });

  it('renders only the measure its own column is', () => {
    renderMeasure('total_amount:avg');

    expect(screen.getByText(/2,503\.32/u)).toBeTruthy();
    expect(screen.queryByText(/302,540,833\.38/u)).toBeNull();
  });

  it('renders the other measure in the other column', () => {
    renderMeasure('total_amount:sum');

    expect(screen.getByText(/302,540,833\.38/u)).toBeTruthy();
    expect(screen.queryByText(/2,503\.32/u)).toBeNull();
  });

  it('does not repeat the measure name in the cell', () => {
    renderMeasure('total_amount:avg');

    expect(screen.queryByText('Average')).toBeNull();
  });

  it('matches by token rather than by splitting the key', () => {
    const oddSummary: TableGroupRowSummary = {
      ...multiSummary,
      aggregates: [{ columnKey: 'odd:col', fn: 'sum', value: '7' }],
    };

    useGetNormalizedColumnMock.mockImplementation(() => {});

    render(
      <TableGroupAggregate columnKey='odd:col:sum' summary={oddSummary} />,
    );

    expect(screen.getByText('7')).toBeTruthy();
  });

  it('marks a measure whose source column carries an active filter', () => {
    useGetHasColumnFilterMock.mockReturnValue(true);

    renderMeasure('total_amount:sum');

    expect(
      screen.getAllByTestId('table-group-aggregate-filtered'),
    ).toHaveLength(1);
  });
});
