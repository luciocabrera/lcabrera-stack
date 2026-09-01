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

type TestRow = Record<string, unknown>;

const ROW_HEIGHT = 40;
const CONTAINER_HEIGHT = 400;

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
        groupingAggregates: [{ columnKey: 'id', fn: 'sum' }],
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

const readExpanded = () =>
  screen
    .getAllByRole('row')
    .map((row) => row.getAttribute('aria-expanded') ?? 'absent');

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

    expect(getGrid().getAttribute('aria-rowcount')).toBe('8');
  });

  it('gives every rendered row a place in one unbroken index sequence', () => {
    render(<Harness />);

    expect(readAria('aria-rowindex').map(Number)).toStrictEqual([
      2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it('numbers the group rows at their own position in the data, not around it', () => {
    render(<Harness />);

    expect(
      groupRows().map((row) => row.getAttribute('aria-rowindex')),
    ).toStrictEqual(['2', '5', '6']);
  });

  it('declares role=treegrid once the rows are a tree', () => {
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
    expect(readAria('aria-setsize').map(Number)).toStrictEqual([
      2, 2, 2, 2, 1, 2, 2,
    ]);
  });

  it('exposes expansion state on the rows that have something to expand', () => {
    render(<Harness />);

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
    render(<Harness />);

    const cells = screen
      .getAllByTestId('table-group-key-cell')
      .map((cell) => cell.textContent);

    expect(cells).toStrictEqual(['Paris', 'Berlin', 'Mitte']);
    expect(
      screen
        .getAllByTestId('table-group-key-carried')
        .map((cell) => cell.textContent),
    ).toStrictEqual(['Berlin']);

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
    render(<Harness />);

    expect(getGrid().querySelectorAll('[role="gridcell"]')).toHaveLength(21);

    for (const row of screen.getAllByRole('row')) {
      expect(row.querySelectorAll('[role="gridcell"]')).toHaveLength(3);
    }
  });

  it('renders an em dash with a spoken equivalent where no aggregate was selected', () => {
    render(<Harness />);

    const absent = screen.getAllByTestId('table-group-aggregate-absent');

    expect(absent.length).toBeGreaterThan(0);
    expect(absent[0]?.textContent).toContain('—');
    expect(absent[0]?.textContent).toContain('No aggregate');
  });

  it('lands the roving tab stop on a group row cell', async () => {
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

    expect(focused?.closest('tr')?.dataset.testid).toBe(
      'table-group-header-row',
    );
    expect(focused?.getAttribute('role')).toBe('gridcell');
    expect(focused?.previousElementSibling?.textContent).toBe('Paris');

    await pressKey('ArrowRight');

    const measure = document.activeElement;

    expect(measure?.textContent).toContain('—');
  });

  it('leaves the grouped-by column blank on a detail row', () => {
    render(<Harness />);

    const detailRow = screen.getAllByRole('row')[1];
    const cells = [...(detailRow?.querySelectorAll('[role="gridcell"]') ?? [])];

    expect(cells.map((cell) => cell.textContent)).toStrictEqual(['', '', '']);

    expect(cells.map((cell) => cell.children.length)).toStrictEqual([0, 0, 1]);
  });
});
