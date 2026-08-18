// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

// Two keys, both declared columns. Under reading B a level renders in its own
// column, so a nested path whose second level names no group key would have
// nowhere to go — the fixture has to be a tree the configuration agrees with
// (ADR-080).
const GROUPING_KEYS = ['city', 'district'];

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'city', label: 'City' },
  { key: 'district', label: 'District' },
];

const rows: readonly TestRow[] = [
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: 2,
      isSubtotal: false,
      path: [{ columnKey: 'city', label: 'Paris', value: 'Paris' }],
    },
  },
  { city: 'Paris', district: 'Marais', id: 1 },
  { city: 'Paris', district: 'Marais', id: 2 },
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: 2,
      isSubtotal: false,
      path: [{ columnKey: 'city', label: 'Berlin', value: 'Berlin' }],
    },
  },
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [{ columnKey: 'id', fn: 'sum', value: '7' }],
      count: 2,
      isSubtotal: false,
      path: [
        { columnKey: 'city', label: 'Berlin', value: 'Berlin' },
        { columnKey: 'district', label: 'Mitte', value: 'Mitte' },
      ],
    },
  },
  { city: 'Berlin', district: 'Mitte', id: 3 },
  { city: 'Berlin', district: 'Mitte', id: 4 },
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

const getGrid = () => screen.getByRole('treegrid');

const groupRows = () => screen.getAllByTestId('table-group-header-row');

const readAria = (attribute: string) =>
  screen.getAllByRole('row').map((row) => row.getAttribute(attribute));

/** `absent` rather than a nullish, so a missing attribute reads as a value. */
const readExpanded = () =>
  screen
    .getAllByRole('row')
    .map((row) => row.getAttribute('aria-expanded') ?? 'absent');

/**
 * Tab into the grid: focus lands on the container, which delegates onwards.
 *
 * Neither helper wraps its call in `act`. `fireEvent` already does so, and the
 * focus handler's update is flushed by the microtask both of them await — the
 * shape `Table.gridFocus.test.tsx` and `Table.treeExpansion.test.tsx` use.
 */
const enterGrid = async () => {
  getGrid().focus();
  await Promise.resolve();
};

const pressKey = async (key: string) => {
  fireEvent.keyDown(document.activeElement ?? getGrid(), { key });
  await Promise.resolve();
};

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

  it("renders a group's key value in that key's own column", () => {
    // No synthetic column and no indentation: the value sits under the header
    // of the column it is a value of, and depth is read from which key columns
    // are filled (ADR-080).
    render(<Harness />);

    const cells = screen
      .getAllByTestId('table-group-key-cell')
      .map((cell) => cell.textContent);

    // `Berlin`'s nested group carries its city from the row above rather than
    // restating it, and draws its own innermost level — so the drawn cells are
    // the three levels the reader has not already been told.
    expect(cells).toStrictEqual(['Paris', 'Berlin', 'Mitte']);
    expect(
      screen
        .getAllByTestId('table-group-key-carried')
        .map((cell) => cell.textContent),
    ).toStrictEqual(['Berlin']);

    // …and that column is the group key's own, not one the grid invented.
    const groupRow = screen.getAllByTestId('table-group-header-row')[0];
    const filled = [
      ...(groupRow?.querySelectorAll('[role="gridcell"]') ?? []),
    ].findIndex((cell) =>
      cell.querySelector('[data-testid="table-group-key-cell"]'),
    );

    expect(filled).toBe(0);
  });

  it('renders a group aggregate under its own column', () => {
    render(<Harness />);

    expect(screen.getByText('7')).toBeTruthy();
  });

  it('gives every row the same number of gridcells, groups included', () => {
    // The assertion this replaces pinned groups at contributing *none*, which
    // is the shape ADR-065 withdrew: a banner had one presentational cell, so a
    // group row was not addressable by column at all. Seven rows across the two
    // declared columns — and no third, because the synthetic hierarchy column
    // is retired: a grouped row paints exactly what the consumer declared, one
    // cell fewer per row than before (ADR-080).
    render(<Harness />);

    expect(getGrid().querySelectorAll('[role="gridcell"]')).toHaveLength(21);

    for (const row of screen.getAllByRole('row')) {
      expect(row.querySelectorAll('[role="gridcell"]')).toHaveLength(3);
    }
  });

  it('renders an em dash with a spoken equivalent where no aggregate was selected', () => {
    // Not blank and not zero: blank already means "this row has no value here"
    // and zero states a number nobody computed. The text beside the glyph is
    // what makes the state readable without depending on punctuation verbosity.
    render(<Harness />);

    const absent = screen.getAllByTestId('table-group-aggregate-absent');

    expect(absent.length).toBeGreaterThan(0);
    expect(absent[0]?.textContent).toContain('—');
    expect(absent[0]?.textContent).toContain('No aggregate');
  });

  it('lands the roving tab stop on a group row cell', async () => {
    // #651: a group row used to swallow the keypress that moved to it, because
    // the focus request was addressed by row *and column* and a one-cell
    // banner registered no cell for any column key. Giving the row real cells
    // answers it with no branch in the focus model (ADR-062, ADR-065).
    render(<Harness />);
    await enterGrid();

    const focused = document.activeElement;

    expect(focused?.getAttribute('role')).toBe('gridcell');
    expect(focused?.closest('tr')?.dataset.testid).toBe(
      'table-group-header-row',
    );
    expect(focused?.getAttribute('tabindex')).toBe('0');
  });

  it('moves along a group row cell by cell, not past the row', async () => {
    render(<Harness />);
    await enterGrid();
    await pressKey('ArrowRight');

    const focused = document.activeElement;

    // Still inside the same group row, one column along: the row is addressable
    // by column like every other row. Column 1 is now the second group key,
    // which this row does not carry a level for — an ordinary empty cell, and
    // still its own tab stop.
    expect(focused?.closest('tr')?.dataset.testid).toBe(
      'table-group-header-row',
    );
    expect(focused?.getAttribute('role')).toBe('gridcell');
    expect(focused?.previousElementSibling?.textContent).toBe('Paris');

    // One more along reaches the measure column, where the em dash states that
    // no aggregate was selected.
    await pressKey('ArrowRight');
    expect(document.activeElement?.textContent).toContain('—');
  });

  it('leaves the grouped-by column blank on a detail row', () => {
    // `city` is the group key, so the group row above states it — in this very
    // column — and the detail rows below leave it blank. Under one column per
    // key that blank sits directly beneath the value explaining it, which is
    // what a drilled group reads as with no rule of its own (ADR-080).
    render(<Harness />);

    const detailRow = screen.getAllByRole('row')[1];
    const cells = [...(detailRow?.querySelectorAll('[role="gridcell"]') ?? [])];

    // City, District, Id — both keys are hoisted to the head and blank here.
    expect(cells.map((cell) => cell.textContent)).toStrictEqual(['', '', '1']);

    // Empty means *empty*, not an empty `<span title="">`. The descriptor hands
    // these cells a fragment rather than `undefined` precisely so the cell
    // holds no element at all — text content alone cannot tell the two apart.
    expect(cells.map((cell) => cell.children.length)).toStrictEqual([0, 0, 1]);
  });
});
