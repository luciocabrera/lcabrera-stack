// @vitest-environment jsdom

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
import { TableHeader } from '#ui/components/Table/TableHeader';

/**
 * Several measures on one column, end to end against real stores (#869).
 *
 * A unit test over `withAggregateColumns` can say the derivation produces two
 * columns. Only a whole grid can say the two are **separately addressable** —
 * that each header is its own sortable `columnheader`, that each cell holds one
 * number rather than both, and that a screen reader is told which column the
 * measures belong to even though the band stating it is decorative.
 */
type TestRow = Record<string, unknown>;

const ROW_HEIGHT = 40;
const CONTAINER_HEIGHT = 400;
const GROUPING_KEYS = ['customer_type'];

const AGGREGATES: readonly TableColumnAggregate[] = [
  { columnKey: 'total_amount', fn: 'avg' },
  { columnKey: 'total_amount', fn: 'min' },
];

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'customer_type', label: 'Customer Type' },
  { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
];

const rows: readonly TestRow[] = [
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [
        { columnKey: 'total_amount', fn: 'avg', value: '2503' },
        { columnKey: 'total_amount', fn: 'min', value: '17' },
      ],
      count: 4,
      isSubtotal: false,
      path: [
        {
          columnKey: 'customer_type',
          label: 'Business',
          value: 'Business',
        },
      ],
    },
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

type HarnessProps = {
  readonly aggregates?: readonly TableColumnAggregate[];
};

const Harness = ({ aggregates = AGGREGATES }: HarnessProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const setContainer = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    attachScrollMetrics(node);
  };

  return (
    <TableConfigProvider<TestRow>
      columnsState={{ columns }}
      metaState={{
        groupingAggregates: aggregates,
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
  );
};

/**
 * A data router, because the header's resize handle reaches `useFetcher` to
 * persist a width. Nothing here exercises that path; it just has to exist.
 */
const renderGrid = (props: HarnessProps = {}) =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        { element: <Harness {...props} />, path: '/' },
      ])}
    />,
  );

/**
 * The **drawn** label of each header, in painted order. Read off the label span
 * rather than the cell, whose `textContent` also collects the actions-menu
 * label and whose accessible name therefore ends in `… column actions`.
 */
const headerLabels = () =>
  screen.getAllByTestId('table-header-label').map((el) => el.textContent);

/** `undefined` where the header states no explicit name — `getAttribute` says
 * `null`, which this repo does not spell. */
const headerAriaLabels = () =>
  screen
    .getAllByRole('columnheader')
    .map((cell) => cell.getAttribute('aria-label') ?? undefined);

describe('a column carrying several measures', () => {
  afterEach(cleanup);

  it('draws one header per measure, not one header for both', () => {
    renderGrid();

    // The defect this replaces: one `Total Amount` header over a cell reading
    // `Average … Minimum …`, truncated together. Four headers now, not three,
    // and the measured column itself is gone — replaced by its measures.
    expect(headerLabels()).toStrictEqual([
      'Customer Type',
      'Id',
      'Average',
      'Minimum',
    ]);
  });

  it('names the source column in each measure header’s accessible name', () => {
    // The band that states it visually is decorative, so without this a screen
    // reader gets a column called `Average` with nothing saying of what.
    renderGrid();

    // The visible label is the function alone; the source column reaches the
    // tree through a visually-hidden span in the same cell, so the header
    // announces `Total Amount Average` rather than a bare `Average`.
    expect(headerAriaLabels()).toStrictEqual([
      // A plain column is its own name; only a derived one has to state two.
      undefined,
      undefined,
      'Total Amount Average',
      'Total Amount Minimum',
    ]);
  });

  it('offers each measure its own sort', () => {
    // `none` means sortable and currently unsorted; an absent attribute would
    // mean the column does not participate in sorting at all.
    renderGrid();

    expect(
      ['Total Amount Average', 'Total Amount Minimum'].map((name) =>
        screen.getByRole('columnheader', { name }).getAttribute('aria-sort'),
      ),
    ).toStrictEqual(['none', 'none']);
  });

  it('spans the measures with one band naming their source column', () => {
    renderGrid();

    const labelled = screen
      .getAllByTestId('table-header-band')
      .filter((band) => band.textContent !== '');

    expect(labelled.map((band) => band.textContent)).toStrictEqual([
      'Total Amount',
    ]);
  });

  it('hides the band row from assistive technology', () => {
    // It carries no cell the focus model can address, and announcing it would
    // add a row to the sequence `aria-rowindex` counts through.
    renderGrid();

    const band = screen.getAllByTestId('table-header-band')[0];

    expect(band?.closest('tr')?.getAttribute('aria-hidden')).toBe('true');
    // One header row in the accessibility tree, plus the one group row.
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('puts one measure in each cell', () => {
    renderGrid();

    const groupRow = screen.getByTestId('table-group-header-row');
    const cells = [...groupRow.querySelectorAll('[role="gridcell"]')].map(
      (cell) => cell.textContent,
    );

    // `Id` shows the no-aggregate dash: it is neither a key nor measured.
    expect(cells).toStrictEqual(['Business', '—No aggregate', '2,503', '17']);
  });

  it('draws no band row at all when no column carries several measures', () => {
    renderGrid({ aggregates: [] });

    expect(screen.queryAllByTestId('table-header-band')).toHaveLength(0);
    expect(headerLabels()).toStrictEqual([
      'Customer Type',
      'Id',
      'Total Amount',
    ]);
    expect(headerAriaLabels()).toStrictEqual([undefined, undefined, undefined]);
  });
});
