// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
import { useSetColumnSorting } from '#ui/components/Table/contexts/TableConfig/columns/actions/useSetColumnSorting.hook';
import { TableWrapperContext } from '#ui/components/Table/contexts/TableWrapper/TableWrapperContext.context';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { TableBase } from '#ui/components/Table/TableBase';
import { TableBody } from '#ui/components/Table/TableBody';
import { TableHeader } from '#ui/components/Table/TableHeader';
import { NotificationProvider } from '#ui/contexts/NotificationContext';

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
  // A detail row: a real order, carrying the raw column values. It
  // renders over the same partition as the group row above it (ADR-065).
  { customer_type: 'Business', id: 7, total_amount: 4200 },
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

/**
 * Sorts a measure column from **inside** the provider tree, the way the header
 * actions menu does. A button rather than a `renderHook`, because the point is
 * that the grid re-renders afterwards against the store the action wrote.
 */
const SortProbe = () => {
  const setColumnSorting = useSetColumnSorting<TestRow>();

  return (
    <button
      onClick={() =>
        setColumnSorting({
          columnKey: 'total_amount:avg' as never,
          direction: 'asc',
        })
      }
      type='button'
    >
      sort by average
    </button>
  );
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
    <NotificationProvider>
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
                <SortProbe />
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
 * A data router, because the header's resize handle reaches `useFetcher` to
 * persist a width, and the sort action posts the new sorting to the
 * persist-cookie route. The route has to exist rather than merely be
 * unexercised: a `useFetcher` submit to a path the router does not know 404s,
 * and React Router hands that to its default error boundary, which replaces the
 * grid with `Unexpected Application Error!` — a whole-tree failure that would
 * mask whatever the assertion was about to check.
 */
const renderGrid = (props: HarnessProps = {}) =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        { element: <Harness {...props} />, path: '/' },
        { action: () => ({ ok: true }), path: '/_action/persist-cookie' },
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
    // `Average … Minimum …`, truncated together. The measured column itself is
    // gone — replaced by its measures — and so is `Id`, which the grouping
    // neither keys nor measures (ADR-095).
    expect(headerLabels()).toStrictEqual([
      'Customer Type',
      'Average',
      'Minimum',
    ]);
  });

  it('names the source column in each measure header’s accessible name', () => {
    // The band that states it visually is decorative, so without this a screen
    // reader gets a column called `Average` with nothing saying of what.
    renderGrid();

    // The visible label is the function alone; the source column reaches the
    // tree through this cell's `aria-label`, so the header announces
    // `Total Amount Average` rather than a bare `Average`. Deliberately not a
    // visually-hidden span — see `TableHeaderCell`, which rejects that for two
    // reasons: the spans concatenate without a separator
    // (`Total AmountAverage`), and a header's accessible name should be the
    // column's name rather than its name plus its menu button's.
    expect(headerAriaLabels()).toStrictEqual([
      // A plain column is its own name; only a derived one has to state two.
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
    // One header row in the accessibility tree, plus the group row and the
    // detail row beneath it — the band row is not among them.
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('puts one measure in each cell', () => {
    renderGrid();

    const groupRow = screen.getByTestId('table-group-header-row');
    const cells = [...groupRow.querySelectorAll('[role="gridcell"]')].map(
      (cell) => cell.textContent,
    );

    // The key's value, then one measure per cell. `Id` is not painted at all:
    // the grouping neither keys nor measures it, so there is no cell for a
    // dash to sit in (ADR-095).
    expect(cells).toStrictEqual(['Business', '2,503', '17']);
  });

  it('survives a sort on a measure column', () => {
    // The regression this pins (#872 review): the sort action rebuilt
    // `normalizedColumns` from the consumer's **declared** column list, which
    // has no measure columns in it, while leaving `pinnedColumnPartition` —
    // which does — untouched. `TableHeaderCell` then looked up
    // `total_amount:avg`, got `undefined`, and destructured it.
    //
    // Sorting a measure is the feature this PR ships, so the crash sat on its
    // own headline path. A unit test over the sort resolver cannot see it: the
    // two lists only diverge once an aggregate is applied, which is state the
    // resolver never receives.
    renderGrid();

    fireEvent.click(screen.getByRole('button', { name: 'sort by average' }));

    expect(headerLabels()).toStrictEqual([
      'Customer Type',
      'Average',
      'Minimum',
    ]);
    expect(
      screen
        .getByRole('columnheader', { name: 'Total Amount Average' })
        .getAttribute('aria-sort'),
    ).toBe('ascending');
  });

  it('leaves a detail row no cell of its own', () => {
    // **A known limitation, pinned so it is a decision rather than a surprise.**
    // Every row renders over the same partition (ADR-065), and a grouped grid
    // paints the group keys and the measures alone (ADR-095) — so a detail row
    // arriving in one has nothing to show: the key blanks because the group row
    // above states it, and the measures are fields it does not carry.
    //
    // Not fixed by keeping the unmeasured columns: they can hold no aggregate,
    // so they would draw the em-dash on every group row of every grouped view,
    // to serve rows a grouped read does not return. ADR-087 opens a group's own
    // rows in a route that applies no grouping, where the declared columns are
    // all present and the question does not arise.
    renderGrid();

    const detail = screen.getAllByRole('row').at(-1);
    const cells = [
      ...(detail?.querySelectorAll('[role="gridcell"]') ?? []),
    ].map((cell) => cell.textContent);

    expect(cells).toStrictEqual(['', '', '']);
  });

  it('bands a single measure too, since its header states only the function', () => {
    // The band is not a multi-measure affordance. `hasHeaderBands` asks whether
    // any column carries a `headerGroupLabel`, and `withAggregateColumns` sets
    // one on every derived column — so one aggregate draws a band over one
    // measure. That is the intended behaviour rather than an accident of the
    // predicate: the visible header reads `Average` whether it has siblings or
    // not, so the source column still has to be stated somewhere.
    renderGrid({ aggregates: [{ columnKey: 'total_amount', fn: 'avg' }] });

    const labelled = screen
      .getAllByTestId('table-header-band')
      .filter((band) => band.textContent !== '');

    expect(labelled.map((band) => band.textContent)).toStrictEqual([
      'Total Amount',
    ]);
    expect(headerLabels()).toStrictEqual(['Customer Type', 'Average']);
  });

  it('draws no band row at all when no aggregate is applied', () => {
    // No measure, so the grouping names only its key and that is the whole
    // grid — there is no source column left for a band to span (ADR-095).
    renderGrid({ aggregates: [] });

    expect(screen.queryAllByTestId('table-header-band')).toHaveLength(0);
    expect(headerLabels()).toStrictEqual(['Customer Type']);
    expect(headerAriaLabels()).toStrictEqual([undefined]);
  });
});
