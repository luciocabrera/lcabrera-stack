// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type {
  TableColumn,
  TableGroupKeyValue,
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

/**
 * Folding a group from the row that starts it rather than from the subtotal
 * that ends it (#802), end to end against real stores.
 *
 * A unit test over `resolveGroupLevelDisclosures` can say which levels a row
 * offers. Only a whole grid can say that the control is **reachable where the
 * reader is looking** — that clicking it folds the level its column holds and
 * not the row's own group, and that what it removes is the block rather than
 * the label. Both were true of the old placement too, on the wrong row.
 */
type TestRow = Record<string, unknown>;

const ROW_HEIGHT = 40;
const CONTAINER_HEIGHT = 400;

const GROUPING_KEYS = ['status', 'customerType', 'priority'];

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'status', label: 'Status' },
  { key: 'customerType', label: 'Customer Type' },
  { key: 'priority', label: 'Priority' },
];

/**
 * Where each key lands once the grouped layout hoists the key columns to the
 * front (ADR-080) — **not** the order `columns` declares them in, which puts
 * the primary key first.
 */
const STATUS_CELL = 0;
const CUSTOMER_CELL = 1;

const pathOf = (...labels: readonly string[]): readonly TableGroupKeyValue[] =>
  labels.map((label, index) => ({
    columnKey: GROUPING_KEYS[index] ?? 'priority',
    label,
    value: label,
  }));

type GroupRowArgs = {
  readonly isSubtotal?: boolean;
  readonly path: readonly TableGroupKeyValue[];
};

const groupRow = ({ isSubtotal = false, path }: GroupRowArgs): TestRow => ({
  [TABLE_GROUP_ROW_FIELD]: { aggregates: [], count: 2, isSubtotal, path },
});

/**
 * A three-level rollup, which is the shape the defect needs: every subtotal is
 * emitted **after** the rows it totals, so under the old placement the only
 * control for `Cancelled` sat on the last row of the block.
 *
 * ```
 * 0  Cancelled Business Critical
 * 1  Cancelled Business High
 * 2  Cancelled Business ·total·      ← path [Cancelled, Business]
 * 3  Cancelled Retail   Critical
 * 4  Cancelled Retail   ·total·      ← path [Cancelled, Retail]
 * 5  Cancelled ·total·               ← path [Cancelled]
 * 6  Active    Business Critical
 * 7  Active    Business ·total·
 * 8  Active    ·total·
 * ```
 */
const rows: readonly TestRow[] = [
  groupRow({ path: pathOf('Cancelled', 'Business', 'Critical') }),
  groupRow({ path: pathOf('Cancelled', 'Business', 'High') }),
  groupRow({ isSubtotal: true, path: pathOf('Cancelled', 'Business') }),
  groupRow({ path: pathOf('Cancelled', 'Retail', 'Critical') }),
  groupRow({ isSubtotal: true, path: pathOf('Cancelled', 'Retail') }),
  groupRow({ isSubtotal: true, path: pathOf('Cancelled') }),
  groupRow({ path: pathOf('Active', 'Business', 'Critical') }),
  groupRow({ isSubtotal: true, path: pathOf('Active', 'Business') }),
  groupRow({ isSubtotal: true, path: pathOf('Active') }),
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
    <TableConfigProvider<TestRow>
      columnsState={{ columns }}
      metaState={{
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
                <TableBody tableContainerRef={containerRef} />
              </TableBase>
            </div>
          </TableWrapperContext>
        </TableDataProvider>
      </TableFocusProvider>
    </TableConfigProvider>
  );
};

const getRows = () => screen.getAllByTestId('table-group-header-row');

type CellArgs = {
  readonly index: number;
  readonly row: Element;
};

const cellOf = ({ index, row }: CellArgs) =>
  [...row.querySelectorAll('[role="gridcell"]')][index];

const chevronIn = (args: CellArgs) =>
  cellOf(args)?.querySelector('[data-testid="table-group-disclosure"]');

/**
 * The labels each row actually **draws**, one string per row.
 *
 * Read off the drawn cells rather than off `textContent`, which would also
 * collect the visually-hidden restatement a carried level renders (ADR-080) and
 * so report every row as stating its whole ancestry.
 */
const drawnLabels = () =>
  getRows().map((row) =>
    [...row.querySelectorAll('[data-testid="table-group-key-cell"]')]
      .map((cell) => cell.textContent?.trim() ?? '')
      .join(' | '),
  );

describe('folding a group from the row that starts it', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      queueMicrotask(() => {
        callback(0);
      });

      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('offers an outer level’s control on the first row of its block', () => {
    render(<Harness />);

    // Row 0 states `Cancelled` and does not own it — under the old placement
    // its only control was on row 5, the subtotal that ends the block.
    expect(
      chevronIn({ index: STATUS_CELL, row: getRows()[0] as Element }),
    ).not.toBeNull();
  });

  it('folds the level the clicked column holds, not the row’s own group', () => {
    render(<Harness />);

    expect(getRows()).toHaveLength(9);

    fireEvent.click(
      chevronIn({
        index: STATUS_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );

    // `Cancelled` folds to its own subtotal; `Active` is untouched. Had the
    // click folded the row's own group — the leaf `Cancelled/Business/Critical`
    // — row 0 alone would have gone and the other eight would have stayed.
    expect(drawnLabels()).toStrictEqual([
      'Cancelled total',
      'Active | Business | Critical',
      'Business total',
      'Active total',
    ]);
  });

  it('removes the nested subtotals with the block, keeping the level’s own', () => {
    render(<Harness />);

    fireEvent.click(
      chevronIn({
        index: STATUS_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );

    const labels = drawnLabels();

    // `Cancelled Business total` and `Cancelled Retail total` are subtotals
    // *inside* the folded block, and go with it...
    expect(labels).not.toContain('Retail total');
    expect(labels.filter((label) => label.includes('Business total'))).toEqual([
      // the one left belongs to `Active`, which was not folded
      'Business total',
    ]);
    // ...while the block's own subtotal survives, because it is what the group
    // collapses *to* and the only row left able to reopen it.
    expect(labels).toContain('Cancelled total');
  });

  it('reopens the group from the subtotal it collapsed to', () => {
    render(<Harness />);

    fireEvent.click(
      chevronIn({
        index: STATUS_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );
    expect(getRows()).toHaveLength(4);

    // The control returns to the subtotal once it is the only row left; without
    // that the group could be closed and never reopened.
    fireEvent.click(
      chevronIn({
        index: STATUS_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );

    expect(getRows()).toHaveLength(9);
  });

  it('leaves an open subtotal no control in the level it totals', () => {
    render(<Harness />);

    // Row 2 is `Cancelled Business ·total·`: it states `Business` as its own
    // innermost level, and the control for that level belongs to row 0.
    expect(
      chevronIn({ index: CUSTOMER_CELL, row: getRows()[2] as Element }),
    ).toBeNull();
    expect(
      chevronIn({ index: CUSTOMER_CELL, row: getRows()[0] as Element }),
    ).not.toBeNull();
  });

  it('reserves the chevron’s space on a drawn cell that has no control', () => {
    render(<Harness />);

    // AC: no row grows or shrinks because of where the chevron moved, and
    // labels stay aligned down the column — so the box is drawn either way.
    const subtotalCell = cellOf({
      index: CUSTOMER_CELL,
      row: getRows()[2] as Element,
    });

    expect(subtotalCell?.querySelector('span')).not.toBeNull();
  });
});
