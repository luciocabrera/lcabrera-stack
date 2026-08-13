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
 * Where row grouping meets the grid's ARIA semantics (ADR-062).
 *
 * Both were built independently — the grid roles and absolute row indexing in
 * #560, multi-key grouping in #569 — and the thing neither suite could check
 * alone is that a group row is **one row of the grid's sequence** rather than an
 * annotation beside it. A group row that carried no `aria-rowindex`, or one that
 * was skipped in the numbering, would make every index after it wrong for a
 * screen reader without failing either component's own tests.
 *
 * The rows below deliberately interleave: group, details, group, details — the
 * shape a grouped read actually returns, and the only shape in which an
 * off-by-one in the numbering is visible.
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

const groupRows = () => screen.getAllByTestId('table-group-header-row');

afterEach(cleanup);

describe('a grouped table under the grid ARIA model', () => {
  it('counts group rows in aria-rowcount alongside the header', () => {
    render(<Harness />);

    // Six body rows (two of them groups) plus the header row.
    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('7');
  });

  it('gives every rendered row a place in one unbroken index sequence', () => {
    render(<Harness />);

    const indices = screen
      .getAllByRole('row')
      .map((row) => Number(row.getAttribute('aria-rowindex')));

    // 1 is the header; the body continues from 2 with no gap and no repeat.
    expect(indices).toStrictEqual([2, 3, 4, 5, 6, 7]);
  });

  it('numbers the group rows at their own position in the data, not around it', () => {
    // The discriminating assertion: the groups sit at data positions 0 and 3,
    // so anything that skipped them in the numbering would put the details at
    // 2..5 and leave these two out.
    render(<Harness />);

    expect(
      groupRows().map((row) => row.getAttribute('aria-rowindex')),
    ).toStrictEqual(['2', '5']);
  });

  it('renders a group row as a row of the grid', () => {
    render(<Harness />);

    for (const row of groupRows()) {
      expect(row.getAttribute('role')).toBe('row');
    }
  });

  it('renders every level of a multi-key group and its aggregates', () => {
    render(<Harness />);

    expect(screen.getByText('City: Berlin')).toBeTruthy();
    expect(screen.getByText('Id: 3')).toBeTruthy();
    expect(screen.getByText('Sum of Id: 7')).toBeTruthy();
  });

  it('keeps one gridcell per data row and column, groups contributing none', () => {
    // Four data rows across two columns. A group row spans the grid with a
    // single presentational cell, so it adds none — which is what makes the
    // count a check on the interleaving rather than on the row total.
    render(<Harness />);

    expect(
      screen.getByRole('grid').querySelectorAll('[role="gridcell"]'),
    ).toHaveLength(8);
  });
});
