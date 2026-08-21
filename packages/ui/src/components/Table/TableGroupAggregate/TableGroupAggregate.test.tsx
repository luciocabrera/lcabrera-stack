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
 * The **derived** measure columns the summary below is read against — what
 * `withAggregateColumns` puts in the store, keyed by aggregate token (#869).
 * `total_amount:sum` is money, `unit_price:avg` is a plain number capped at two
 * decimals, and `order_count:count` is a tally over a column declared as money
 * — which is what makes three near identical raw inputs render three different
 * ways.
 */
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
    renderAggregate('total_amount:sum');

    expect(screen.getByText(/302,540,833\.38/u)).toBeTruthy();
    expect(screen.queryByText('302540833.38')).toBeNull();
  });

  it('honours the column’s fraction digits on an average', () => {
    // `avg` over `numeric` comes back at full scale. Nothing but the column's
    // own format descriptor says how much of that to show.
    renderAggregate('unit_price:avg');

    expect(screen.getByText('2,503.32')).toBeTruthy();
  });

  it('renders a count as a tally even on a currency column', () => {
    // The discriminating case for `resolveAggregateDataType`, now resolved by
    // the derivation rather than here: `count` answers "how many rows", not
    // "how many dollars", so the derived column is a number even though the
    // column it measures is money.
    renderAggregate('order_count:count');

    expect(screen.getByText('1,380')).toBeTruthy();
    expect(screen.queryByText(/\$/u)).toBeNull();
  });

  it('renders a genuine zero as a value, not as an absence', () => {
    // The discriminating case for the dash: a `sum()` of `0.00` over a group
    // with no discounts is a computed number, and must not read like a column
    // nobody asked for an aggregate on. The column is undeclared here, so it
    // falls back to `string` and the raw text is what renders.
    renderAggregate('discount:sum');

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
    // A derived key holds no filter and never could — the filter belongs to
    // the column the measure summarises.
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
    // The defect this replaces: both measures landed in the source column's
    // one cell, truncated together under a header that named neither (#869).
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
    // The header states it now, once, under the source column's label — which
    // is the whole point of giving each measure a column.
    renderMeasure('total_amount:avg');

    expect(screen.queryByText('Average')).toBeNull();
  });

  it('matches by token rather than by splitting the key', () => {
    // A consumer's column key may legitimately contain the separator, so the
    // cell compares tokens instead of guessing where the key ends.
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
