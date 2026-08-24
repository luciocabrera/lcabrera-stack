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
    // tree through this cell's `aria-label`, so the header announces
    // `Total Amount Average` rather than a bare `Average`. Deliberately not a
    // visually-hidden span — see `TableHeaderCell`, which rejects that for two
    // reasons: the spans concatenate without a separator
    // (`Total AmountAverage`), and a header's accessible name should be the
    // column's name rather than its name plus its menu button's.
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

    // `Id` shows the no-aggregate dash: it is neither a key nor measured.
    expect(cells).toStrictEqual(['Business', '—No aggregate', '2,503', '17']);
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
      'Id',
      'Average',
      'Minimum',
    ]);
    expect(
      screen
        .getByRole('columnheader', { name: 'Total Amount Average' })
        .getAttribute('aria-sort'),
    ).toBe('ascending');
  });

  it('leaves a detail row no cell for its raw measured value', () => {
    // **A known limitation, pinned so it is a decision rather than a surprise.**
    // Every row renders over the same partition (ADR-065), and replacing the
    // measured column takes `total_amount` off the grid entirely — so a detail
    // row, which holds no `total_amount:avg` field, has nowhere to show its own
    // amount. Only the primary key survives, because that column is measured
    // beside itself rather than replaced.
    //
    // Not fixed by keeping the source column alongside its measures: that
    // column can hold no aggregate, so it would draw the em-dash on every group
    // row of every grouped view, to serve detail rows the inline drill spliced
    // in. #870 replaced that with a modal route that applies no
    // grouping, where the declared columns are all present and the question
    // does not arise.
    renderGrid();

    const detail = screen.getAllByRole('row').at(-1);
    const cells = [
      ...(detail?.querySelectorAll('[role="gridcell"]') ?? []),
    ].map((cell) => cell.textContent);

    // `customer_type` blanks because the group row above states it; `id` is the
    // primary key; both measure columns are empty. `4200` is unreachable.
    expect(cells).toStrictEqual(['', '7', '', '']);
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
    expect(headerLabels()).toStrictEqual(['Customer Type', 'Id', 'Average']);
  });

  it('draws no band row at all when no aggregate is applied', () => {
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
