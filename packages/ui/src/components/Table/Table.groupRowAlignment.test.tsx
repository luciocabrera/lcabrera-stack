// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

import {
  TableConfigProvider,
  TableDataProvider,
  TableFocusProvider,
} from '#ui/components/Table/contexts';
import { TableWrapperContext } from '#ui/components/Table/contexts/TableWrapper/TableWrapperContext.context';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { TableBase } from '#ui/components/Table/TableBase';
import { TableBody } from '#ui/components/Table/TableBody';
import { tableBodyCellStyles } from '#ui/components/Table/TableBodyCell/TableBodyCell.stylex';
import { TableHeader } from '#ui/components/Table/TableHeader';
import { NotificationProvider } from '#ui/contexts/NotificationContext';

/**
 * A cell's alignment follows its **column's** type, on a group row as well as on the detail
 * rows beneath it (#1018).
 *
 * A unit test over `getCellStyleProps` can say the flag is honoured, and one over
 * `buildTableBodyCellDescriptor` can say the type is carried. Neither can say the two meet:
 * every group-row cell is built through the descriptor's `custom` branch, which is the
 * branch that used to mean "do not align", so only a whole grouped grid shows a currency
 * total and the numbers below it sharing one edge.
 */
type TestRow = Record<string, unknown>;

const ROW_HEIGHT = 40;
const CONTAINER_HEIGHT = 400;
const GROUPING_KEYS = ['order_date'];

const AGGREGATES: readonly TableColumnAggregate[] = [
  { columnKey: 'total_amount', fn: 'sum' },
];

/**
 * One column of each alignment, plus one that renders its own content. `invoice` declares
 * `currency` **and** a `render()`, which is what makes it discriminating: the type is
 * present and must still not be applied on a detail row, because the layout of a consumer's
 * own output is the consumer's to decide.
 */
const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { dataType: 'date', key: 'order_date', label: 'Order Date' },
  { dataType: 'currency', key: 'total_amount', label: 'Total Amount' },
  { dataType: 'date', key: 'shipped_at', label: 'Shipped At' },
  {
    dataType: 'currency',
    key: 'invoice',
    label: 'Invoice',
    render: (row) => <span>{String(row.invoice)}</span>,
  },
];

const rows: readonly TestRow[] = [
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [{ columnKey: 'total_amount', fn: 'sum', value: '4200' }],
      count: 1,
      isSubtotal: false,
      path: [
        { columnKey: 'order_date', label: '2026-01-04', value: '2026-01-04' },
      ],
    },
  },
  // A detail row of that group, carrying the raw column values. It renders over the same
  // partition as the group row above it (ADR-065).
  {
    id: 7,
    invoice: 99,
    order_date: '2026-01-04',
    shipped_at: '2026-01-06',
    total_amount: 4200,
  },
];

const attachScrollMetrics = (container: HTMLDivElement | null) => {
  if (!container) return;
  if (Object.getOwnPropertyDescriptor(container, 'scrollTop')) return;

  Object.defineProperties(container, {
    clientHeight: { configurable: true, value: CONTAINER_HEIGHT },
    offsetHeight: { configurable: true, value: CONTAINER_HEIGHT },
    scrollTop: { configurable: true, value: 0, writable: true },
  });
};

const Harness = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const setContainer = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    attachScrollMetrics(node);
  };

  return (
    <NotificationProvider>
      <TableConfigProvider<TestRow>
        columnsState={{ columns }}
        metaState={{
          groupingAggregates: AGGREGATES,
          groupingKeys: GROUPING_KEYS,
          overscan: 2,
          rowHeight: ROW_HEIGHT,
        }}
      >
        <TableFocusProvider>
          <TableDataProvider<TestRow>
            dataState={{
              data: rows,
              isLoading: false,
              isLoadingMore: false,
              totalRows: rows.length,
            }}
          >
            <TableWrapperContext value={{ containerRef, wrapperRef }}>
              <div data-testid='scroll-container' ref={setContainer}>
                <TableBase>
                  <TableHeader />
                  <TableBody tableContainerRef={containerRef} />
                </TableBase>
              </div>
            </TableWrapperContext>
          </TableDataProvider>
        </TableFocusProvider>
      </TableConfigProvider>
    </NotificationProvider>
  );
};

/**
 * A data router: the header's resize handle reaches `useFetcher`, and a submit to a path the
 * router does not know 404s into React Router's default error boundary, which would replace
 * the grid with an error page and mask whatever was about to be asserted.
 */
const renderGrid = () =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        { element: <Harness />, path: '/' },
        { action: () => ({ ok: true }), path: '/_action/persist-cookie' },
      ])}
    />,
  );

const classesOf = (className: string | undefined) =>
  (className ?? '').split(' ').filter(Boolean);

/**
 * Compiled here from the same style objects the cell uses, never written out as a hashed
 * literal: a StyleX class name changes with its declaration, so a literal would stop
 * matching the day the style moved and report every cell as unaligned.
 */
const RIGHT_CLASSES = classesOf(
  stylex.props(tableBodyCellStyles.alignRight).className,
);
const CENTER_CLASSES = classesOf(
  stylex.props(tableBodyCellStyles.alignCenter).className,
);

const alignmentOf = (cell: Element | undefined) => {
  if (cell === undefined) return 'missing';

  const applied = new Set(classesOf(cell.className));

  if (RIGHT_CLASSES.every((cls) => applied.has(cls))) return 'right';
  if (CENTER_CLASSES.every((cls) => applied.has(cls))) return 'center';

  return 'default';
};

/**
 * One row's alignment keyed by the column drawn above it. Headers and cells are painted from
 * the same partition in the same order, so position is the join — and a measure column's
 * header reads as its function (`Sum`), with the source column stated by the decorative
 * band.
 */
const alignmentsByColumn = (row: Element | undefined) => {
  const labels = screen
    .getAllByTestId('table-header-label')
    .map((el) => el.textContent ?? '');
  const cells = [...(row?.querySelectorAll('[role="gridcell"]') ?? [])];

  return Object.fromEntries(
    labels.map((label, index) => [label, alignmentOf(cells[index])]),
  );
};

const groupRowAlignments = () =>
  alignmentsByColumn(screen.getByTestId('table-group-header-row'));

const detailRowAlignments = () =>
  alignmentsByColumn(screen.getAllByRole('row').at(-1));

describe('cell alignment on a grouped grid', () => {
  afterEach(cleanup);

  it('aligns every group-row cell by its own column’s type', () => {
    // The defect in one assertion: before #1018 every entry here read `default`, because
    // each of these cells is built through the descriptor's `custom` branch and that branch
    // skipped alignment outright.
    renderGrid();

    expect(groupRowAlignments()).toStrictEqual({
      Id: 'default',
      Invoice: 'right',
      'Order Date': 'center',
      'Shipped At': 'center',
      Sum: 'right',
    });
  });

  it('aligns a detail row’s cells the same way, bar the one the consumer renders', () => {
    // `Invoice` declares `currency` exactly as the measure column does, and the only
    // difference is who produced the content — which is what makes it the discriminating
    // case rather than a second reading of the same fact. `Order Date` is blanked here
    // (its value is stated once, by the group row above) and still aligns like its column.
    renderGrid();

    expect(detailRowAlignments()).toStrictEqual({
      // No declared type; `7` is detected as a number from the value.
      Id: 'right',
      Invoice: 'default',
      'Order Date': 'center',
      'Shipped At': 'center',
      // The detail row holds no `total_amount:sum` field, so this cell is empty — and an
      // empty cell in a currency column is still a currency column's cell.
      Sum: 'right',
    });
  });
});
