// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

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
 * Where row grouping meets the grid's ARIA semantics (ADR-062, ADR-067).
 *
 * Both were built independently — the grid roles and absolute row indexing in
 * #560, multi-key grouping in #569 — and the thing neither suite could check
 * alone is that a group row is **one row of the grid's sequence** rather than an
 * annotation beside it. A group row that carried no `aria-rowindex`, or one that
 * was skipped in the numbering, would make every index after it wrong for a
 * screen reader without failing either component's own tests.
 *
 * The rows below are a real tree: two top-level groups, one of them carrying a
 * nested second-level group, and detail rows at the bottom of each branch. That
 * is the only shape in which an off-by-one in the numbering, a level read from
 * position rather than from the group's own path, or a set size counted across
 * the wrong parent is visible.
 */
type TestRow = Record<string, unknown>;

const ROW_HEIGHT = 40;
const CONTAINER_HEIGHT = 400;

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'city', label: 'City' },
];

const rows: readonly TestRow[] = [
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: 2,
      path: [{ columnKey: 'city', label: 'Paris' }],
    },
  },
  { city: 'Paris', id: 1 },
  { city: 'Paris', id: 2 },
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: 2,
      path: [{ columnKey: 'city', label: 'Berlin' }],
    },
  },
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [{ columnKey: 'id', fn: 'sum', label: '7' }],
      count: 2,
      path: [
        { columnKey: 'city', label: 'Berlin' },
        { columnKey: 'id', label: '3' },
      ],
    },
  },
  { city: 'Berlin', id: 3 },
  { city: 'Berlin', id: 4 },
];

/**
 * jsdom lays nothing out, so the scroll container reports zero for every box
 * metric. These are the numbers the virtualization window is computed from.
 */
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
      metaState={{ overscan: 2, rowHeight: ROW_HEIGHT }}
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

const getGrid = () => screen.getByRole('treegrid');

const groupRows = () => screen.getAllByTestId('table-group-header-row');

const readAria = (attribute: string) =>
  screen.getAllByRole('row').map((row) => row.getAttribute(attribute));

/** `absent` rather than a nullish, so a missing attribute reads as a value. */
const readExpanded = () =>
  screen
    .getAllByRole('row')
    .map((row) => row.getAttribute('aria-expanded') ?? 'absent');

afterEach(cleanup);

describe('a grouped table under the grid ARIA model', () => {
  it('counts group rows in aria-rowcount alongside the header', () => {
    render(<Harness />);

    // Seven body rows (three of them groups) plus the header row.
    expect(getGrid().getAttribute('aria-rowcount')).toBe('8');
  });

  it('gives every rendered row a place in one unbroken index sequence', () => {
    render(<Harness />);

    // 1 is the header; the body continues from 2 with no gap and no repeat.
    expect(readAria('aria-rowindex').map(Number)).toStrictEqual([
      2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it('numbers the group rows at their own position in the data, not around it', () => {
    // The discriminating assertion: the groups sit at data positions 0, 3 and
    // 4, so anything that skipped them in the numbering would put the details
    // at 2..5 and leave these three out.
    render(<Harness />);

    expect(
      groupRows().map((row) => row.getAttribute('aria-rowindex')),
    ).toStrictEqual(['2', '5', '6']);
  });

  it('declares role=treegrid once the rows are a tree', () => {
    // Asked of the rows, not of the grouping configuration (ADR-067) — the same
    // question `TableBodyRows` asks to decide which component a row gets.
    render(<Harness />);

    expect(getGrid()).toBe(screen.getByTestId('table'));
  });

  it('renders a group row as a row of the grid', () => {
    render(<Harness />);

    for (const row of groupRows()) {
      expect(row.getAttribute('role')).toBe('row');
    }
  });

  it('states each row level from the group path, not from its position', () => {
    // Paris, its two details, Berlin, Berlin/3, and its two details. The nested
    // group is level 2 because its own path carries two keys — a level counted
    // from how many rows preceded it would put it at 4.
    render(<Harness />);

    expect(readAria('aria-level').map(Number)).toStrictEqual([
      1, 2, 2, 1, 2, 3, 3,
    ]);
  });

  it('positions each row within its own parent set, not the whole grid', () => {
    render(<Harness />);

    expect(readAria('aria-posinset').map(Number)).toStrictEqual([
      1, 1, 2, 2, 1, 1, 2,
    ]);
    // Two roots; two details under Paris; one nested group under Berlin; two
    // details under that. A set size counted over the grid would answer 7,
    // seven times.
    expect(readAria('aria-setsize').map(Number)).toStrictEqual([
      2, 2, 2, 2, 1, 2, 2,
    ]);
  });

  it('exposes expansion state on the rows that have something to expand', () => {
    render(<Harness />);

    // Every group row here owns rows below it and is open; a detail row is a
    // leaf, and announcing `aria-expanded` on one would offer a control the
    // user cannot operate.
    expect(readExpanded()).toStrictEqual([
      'true',
      'absent',
      'absent',
      'true',
      'true',
      'absent',
      'absent',
    ]);
  });

  it('renders every level of a multi-key group and its aggregates', () => {
    render(<Harness />);

    expect(screen.getAllByText('City: Berlin')).toHaveLength(2);
    expect(screen.getByText('Id: 3')).toBeTruthy();
    expect(screen.getByText('Sum of Id: 7')).toBeTruthy();
  });

  it('keeps one gridcell per data row and column, groups contributing none', () => {
    // Four data rows across two columns. A group row spans the grid with a
    // single presentational cell, so it adds none — which is what makes the
    // count a check on the interleaving rather than on the row total.
    //
    // ADR-065 records this assertion as inverting when the hierarchy column
    // lands (#570): a group row will then contribute a full row of gridcells.
    render(<Harness />);

    expect(getGrid().querySelectorAll('[role="gridcell"]')).toHaveLength(8);
  });
});
