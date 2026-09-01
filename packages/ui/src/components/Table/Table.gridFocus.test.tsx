// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { useRef } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import {
  TableConfigProvider,
  TableDataProvider,
  TableFocusProvider,
} from '#ui/components/Table/contexts';
import { TableWrapperContext } from '#ui/components/Table/contexts/TableWrapper/TableWrapperContext.context';
import { TableBase } from '#ui/components/Table/TableBase';
import { TableBody } from '#ui/components/Table/TableBody';

type TestRow = Record<string, unknown>;

const ROW_HEIGHT = 40;
const OVERSCAN = 2;
const CONTAINER_HEIGHT = 400;
const TOTAL_ROWS = 200;
const VISIBLE_ROWS = CONTAINER_HEIGHT / ROW_HEIGHT;

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'city', label: 'City' },
  { key: 'status', label: 'Status' },
];

const rows: readonly TestRow[] = Array.from(
  { length: TOTAL_ROWS },
  (_unused, index) => ({
    city: `City ${index}`,
    id: index,
    status: `Status ${index}`,
  }),
);

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
      metaState={{ overscan: OVERSCAN, rowHeight: ROW_HEIGHT }}
    >
      <TableFocusProvider>
        <TableDataProvider<TestRow>
          dataState={{
            data: rows,
            isLoading: false,
            isLoadingMore: false,
            totalRows: TOTAL_ROWS,
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

const getGrid = () => screen.getByRole('grid');

const getScrollContainer = () => screen.getByTestId('scroll-container');

const getTabStops = () => [...getGrid().querySelectorAll('[tabindex="0"]')];

const getAllTabStops = () => {
  const grid = getGrid();

  return [...(grid.tabIndex === 0 ? [grid] : []), ...getTabStops()];
};

const getRenderedRowIndices = () =>
  screen
    .getAllByRole('row')
    .map((row) => Number(row.getAttribute('aria-rowindex')));

const readFocusedCell = () => {
  const cell = document.activeElement;

  return {
    ariaRowIndex: cell?.closest('tr')?.getAttribute('aria-rowindex'),
    text: cell?.textContent,
  };
};

const flushScroll = async () => {
  await act(async () => {
    getScrollContainer().dispatchEvent(new Event('scroll'));
  });
};

const scrollTo = async (scrollTop: number) => {
  getScrollContainer().scrollTop = scrollTop;
  await flushScroll();
};

type PressKeyArgs = {
  readonly isRangeModifier?: boolean;
  readonly key: string;
};

const pressKey = async ({ isRangeModifier = false, key }: PressKeyArgs) => {
  fireEvent.keyDown(document.activeElement ?? getGrid(), {
    ctrlKey: isRangeModifier,
    key,
  });
  await flushScroll();
};

const enterGrid = async () => {
  getGrid().focus();
  await flushScroll();
};

describe('grid focus model', () => {
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

  it('declares grid, rowgroup, row and gridcell roles on the elements that carry them', () => {
    render(<Harness />);

    const grid = getGrid();
    expect(grid.tagName).toBe('TABLE');
    expect(grid.getAttribute('role')).toBe('grid');

    const body = screen.getByTestId('table-body');
    expect(body.tagName).toBe('TBODY');
    expect(body.getAttribute('role')).toBe('rowgroup');

    const rows = [...body.querySelectorAll('tr:not([aria-hidden="true"])')];
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(row.getAttribute('role')).toBe('row');
    }

    const cells = [...body.querySelectorAll('td')].filter(
      (cell) => cell.closest('tr')?.getAttribute('aria-hidden') !== 'true',
    );
    expect(cells.length).toBe(rows.length * 3);

    for (const cell of cells) {
      expect(cell.getAttribute('role')).toBe('gridcell');
    }
  });

  it('hides the virtualization spacer rows from the accessibility tree', async () => {
    render(<Harness />);
    await scrollTo(ROW_HEIGHT * 50);

    const body = screen.getByTestId('table-body');
    const spacers = [...body.querySelectorAll('tr[aria-hidden="true"]')];
    const rowElements = [...body.querySelectorAll('tr')];

    expect(spacers.length).toBe(2);
    expect(screen.getAllByRole('row').length).toBe(
      rowElements.length - spacers.length,
    );

    for (const spacer of spacers) {
      expect(spacer.getAttribute('role')).toBeNull();
    }
  });

  it('reports aria-rowcount over the whole dataset, not the rendered window', () => {
    render(<Harness />);

    expect(getGrid().getAttribute('aria-rowcount')).toBe(
      String(TOTAL_ROWS + 1),
    );
    expect(screen.getAllByRole('row').length).toBeLessThan(TOTAL_ROWS);
  });

  it('reports aria-rowindex absolutely, on a row that is not the first rendered', async () => {
    render(<Harness />);
    await scrollTo(ROW_HEIGHT * 100);

    const renderedIndices = getRenderedRowIndices();
    const [first, second] = renderedIndices;

    expect(first).toBe(100 - OVERSCAN + 2);
    expect(second).toBe(100 - OVERSCAN + 3);
    expect(renderedIndices).not.toContain(2);
  });

  it('ends the row-index sequence exactly where aria-rowcount says it does', async () => {
    render(<Harness />);
    await scrollTo(ROW_HEIGHT * TOTAL_ROWS);

    const renderedIndices = getRenderedRowIndices();
    const lastIndex = renderedIndices.at(-1);

    expect(lastIndex).toBe(Number(getGrid().getAttribute('aria-rowcount')));
  });

  it('keeps exactly one tab stop as focus enters, moves and leaves the window', async () => {
    render(<Harness />);

    expect(getAllTabStops()).toEqual([getGrid()]);

    await enterGrid();
    const entered = getAllTabStops();
    expect(entered.length).toBe(1);
    expect(entered[0]?.getAttribute('role')).toBe('gridcell');

    await pressKey({ key: 'ArrowDown' });
    expect(getAllTabStops().length).toBe(1);

    await scrollTo(ROW_HEIGHT * 150);
    expect(getAllTabStops()).toEqual([getGrid()]);
  });

  it('moves the tab stop with the arrow keys, without wrapping at an edge', async () => {
    render(<Harness />);
    await enterGrid();

    expect(readFocusedCell()).toEqual({ ariaRowIndex: '2', text: '0' });

    await pressKey({ key: 'ArrowRight' });
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '2', text: 'City 0' });

    await pressKey({ key: 'ArrowDown' });
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '3', text: 'City 1' });

    await pressKey({ key: 'ArrowLeft' });
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '3', text: '1' });

    await pressKey({ key: 'ArrowLeft' });
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '3', text: '1' });

    await pressKey({ key: 'ArrowUp' });
    await pressKey({ key: 'ArrowUp' });
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '2', text: '0' });
  });

  it('moves within the row on Home and End, and across the grid with the range modifier', async () => {
    render(<Harness />);
    await enterGrid();
    await pressKey({ key: 'ArrowDown' });

    await pressKey({ key: 'End' });
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '3', text: 'Status 1' });

    await pressKey({ key: 'Home' });
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '3', text: '1' });

    await pressKey({ isRangeModifier: true, key: 'End' });
    expect(readFocusedCell()).toEqual({
      ariaRowIndex: String(TOTAL_ROWS + 1),
      text: `Status ${TOTAL_ROWS - 1}`,
    });

    await pressKey({ isRangeModifier: true, key: 'Home' });
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '2', text: '0' });
  });

  it('moves by a viewport of rows on PageDown and PageUp', async () => {
    render(<Harness />);
    await enterGrid();

    await pressKey({ key: 'PageDown' });
    expect(readFocusedCell().ariaRowIndex).toBe(String(VISIBLE_ROWS + 2));

    await pressKey({ key: 'PageDown' });
    expect(readFocusedCell().ariaRowIndex).toBe(String(VISIBLE_ROWS * 2 + 2));

    await pressKey({ key: 'PageUp' });
    expect(readFocusedCell().ariaRowIndex).toBe(String(VISIBLE_ROWS + 2));
  });

  it('leaves a key it does not claim to the page', async () => {
    render(<Harness />);
    await enterGrid();

    const grid = getGrid();
    const claimed = fireEvent.keyDown(grid, { key: 'ArrowDown' });
    const unclaimed = fireEvent.keyDown(grid, { key: 'a' });

    expect(claimed).toBe(false);
    expect(unclaimed).toBe(true);
  });

  it('restores focus to the same row after it scrolls out of the window and back', async () => {
    render(<Harness />);
    await enterGrid();

    await pressKey({ key: 'ArrowDown' });
    await pressKey({ key: 'ArrowDown' });
    await pressKey({ key: 'ArrowDown' });
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '5', text: '3' });

    await scrollTo(ROW_HEIGHT * 150);

    expect(getRenderedRowIndices()).not.toContain(5);
    expect(document.activeElement).toBe(document.body);

    await scrollTo(0);

    expect(getRenderedRowIndices()).toContain(5);
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '5', text: '3' });
  });

  it('is re-entered at the row it was left on, not at its first cell', async () => {
    render(<Harness />);
    await enterGrid();
    await pressKey({ key: 'ArrowDown' });
    await pressKey({ key: 'ArrowDown' });
    await pressKey({ key: 'ArrowRight' });

    await scrollTo(ROW_HEIGHT * 150);
    expect(document.activeElement).toBe(document.body);
    expect(getRenderedRowIndices()).not.toContain(4);

    await enterGrid();
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '4', text: 'City 2' });

    await pressKey({ key: 'ArrowDown' });
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '5', text: 'City 3' });
  });

  it('takes the tab stop from a cell that is clicked into', async () => {
    render(<Harness />);

    const cell = screen.getAllByRole('gridcell')[4];
    await act(async () => {
      (cell as HTMLElement).focus();
    });

    expect(getAllTabStops()).toEqual([cell]);
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '3', text: 'City 1' });
  });
});
