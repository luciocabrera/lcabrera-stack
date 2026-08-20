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

/**
 * The columns the summary below is read against. `total_amount` is money,
 * `unit_price` is a plain number capped at two decimals, and `order_count` is
 * money that will be asked for a tally — which is what makes three near
 * identical raw inputs render three different ways.
 */
const COLUMNS: Record<string, TableColumn<Record<string, unknown>>> = {
  order_count: { dataType: 'currency', key: 'order_count', label: 'Orders' },
  total_amount: {
    dataType: 'currency',
    format: { currency: { currency: 'USD', locale: 'en-US' } },
    key: 'total_amount',
    label: 'Total Amount',
  },
  unit_price: {
    dataType: 'number',
    format: { number: { maximumFractionDigits: 2, minimumFractionDigits: 2 } },
    key: 'unit_price',
    label: 'Unit Price',
  },
};

/**
 * Values as `pg` actually hands them over: `numeric` and `bigint` arrive as
 * **strings**, because neither survives a JS number losslessly. Writing them
 * as numbers here would test a case the database never produces.
 */
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
    // The regression this replaces: the value reached the cell already
    // stringified by the group-KEY formatter, so a `numeric` sum rendered as
    // the raw `302540833.38` under a currency header and was then ellipsized
    // by the column.
    renderAggregate('total_amount');

    expect(screen.getByText(/302,540,833\.38/u)).toBeTruthy();
    expect(screen.queryByText('302540833.38')).toBeNull();
  });

  it('honours the column’s fraction digits on an average', () => {
    // `avg` over `numeric` comes back at full scale. Nothing but the column's
    // own format descriptor says how much of that to show.
    renderAggregate('unit_price');

    expect(screen.getByText('2,503.32')).toBeTruthy();
  });

  it('renders a count as a tally even on a currency column', () => {
    // The discriminating case for `resolveAggregateDataType`: `count` answers
    // "how many rows", not "how many dollars". Inheriting the column's type
    // here would put a currency symbol and two decimals on an integer.
    renderAggregate('order_count');

    expect(screen.getByText('1,380')).toBeTruthy();
    expect(screen.queryByText(/\$/u)).toBeNull();
  });

  it('renders a genuine zero as a value, not as an absence', () => {
    // The discriminating case for the dash: a `sum()` of `0.00` over a group
    // with no discounts is a computed number, and must not read like a column
    // nobody asked for an aggregate on. The column is undeclared here, so it
    // falls back to `string` and the raw text is what renders.
    renderAggregate('discount');

    expect(screen.getByText('0.00')).toBeTruthy();
    expect(screen.queryByTestId('table-group-aggregate-absent')).toBeNull();
  });

  it('renders a dash with a spoken equivalent where none was selected', () => {
    renderAggregate('customer_name');

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

    renderAggregate('total_amount');

    expect(screen.getByTestId('table-group-aggregate-filtered')).toBeTruthy();
    expect(
      screen.getByTestId('table-group-aggregate-filtered').textContent,
    ).toContain('filtered rows only');
  });

  it('leaves an unfiltered column unmarked', () => {
    renderAggregate('total_amount');

    expect(screen.queryByTestId('table-group-aggregate-filtered')).toBeNull();
  });

  it('asks about its own column, not about the table', () => {
    renderAggregate('total_amount');

    expect(useGetHasColumnFilterMock).toHaveBeenCalledWith('total_amount');
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

  const renderMulti = () => {
    useGetNormalizedColumnMock.mockImplementation(
      (key: unknown) => COLUMNS[key as string],
    );

    return render(
      <TableGroupAggregate columnKey='total_amount' summary={multiSummary} />,
    );
  };

  afterEach(() => {
    cleanup();
    useGetHasColumnFilterMock.mockReturnValue(false);
    useGetNormalizedColumnMock.mockReset();
  });

  it('renders every measure the row carries for the column', () => {
    renderMulti();

    expect(screen.getByText(/2,503\.32/u)).toBeTruthy();
    expect(screen.getByText(/302,540,833\.38/u)).toBeTruthy();
  });

  it('names each measure, so two numbers side by side are readable', () => {
    // Without this the cell shows two bare figures and nothing says which is
    // the average and which the sum (#831).
    renderMulti();

    expect(screen.getByText('Average')).toBeTruthy();
    expect(screen.getByText('Sum')).toBeTruthy();
  });

  it('names nothing when the column carries a single measure', () => {
    // The prefix earns its place only where the cell is ambiguous; on every
    // other column of every group row it would be noise.
    renderAggregate('unit_price');

    expect(screen.queryByText('Average')).toBeNull();
  });

  it('renders the filter indicator once for the cell, not once per measure', () => {
    // The filter belongs to the column, and every measure in the cell is
    // computed over the same surviving rows.
    useGetHasColumnFilterMock.mockReturnValue(true);

    renderMulti();

    expect(
      screen.getAllByTestId('table-group-aggregate-filtered'),
    ).toHaveLength(1);
  });
});
