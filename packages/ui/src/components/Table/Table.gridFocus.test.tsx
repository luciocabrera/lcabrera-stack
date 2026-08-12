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
/** `getVerticalVirtualizationWindow`: `ceil(containerHeight / itemHeight)`. */
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

/**
 * jsdom lays nothing out, so the scroll container reports zero for every box
 * metric and ignores writes to `scrollTop`. These are the three numbers the
 * virtualization window and the grid's paging are computed from, installed on
 * the real element the component scrolls, so the code under test is untouched.
 *
 * Installed once per element: a callback ref re-runs whenever its identity
 * changes, and re-defining `scrollTop` would silently rewind the container to
 * the top on the next render.
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

/** The whole grid's tab stops, the container itself included. */
const getAllTabStops = () => {
  const grid = getGrid();

  return [...(grid.tabIndex === 0 ? [grid] : []), ...getTabStops()];
};

const getRenderedRowIndices = () =>
  screen
    .getAllByRole('row')
    .map((row) => Number(row.getAttribute('aria-rowindex')));

/** The row and column the DOM is actually focused on, read back off the node. */
const readFocusedCell = () => {
  const cell = document.activeElement;

  return {
    ariaRowIndex: cell?.closest('tr')?.getAttribute('aria-rowindex'),
    text: cell?.textContent,
  };
};

/**
 * A browser raises `scroll` for a programmatic `scrollTop` write; jsdom does
 * not. Every scroll the grid performs on its own therefore needs this to reach
 * the virtualization window, which is exactly what a real browser would do for
 * it one frame later.
 *
 * The **awaited async** `act` is load-bearing and is the only one in this file
 * that is: the scroll listener defers its state update through
 * `requestAnimationFrame`, so nothing but an act that drains microtasks flushes
 * the re-render. Every other helper here ends by awaiting this one, which is
 * why none of them needs an `act` of its own — `fireEvent` and a plain
 * `.focus()` both settle before this returns.
 */
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

/** Tab into the grid: focus lands on the container, which delegates onwards. */
const enterGrid = async () => {
  getGrid().focus();
  await flushScroll();
};

describe('grid focus model', () => {
  beforeEach(() => {
    // A frame, deferred. Running the callback synchronously would be the
    // obvious stub and is wrong: the scroll listener stores the handle this
    // call returns and clears it from inside the callback, so a synchronous
    // one clears it first and the assignment then leaves a handle behind that
    // suppresses every later scroll.
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
    // Every assertion here reads the `role` ATTRIBUTE, not a role query.
    // Testing Library resolves implicit roles, and `<tr>` implicitly maps to
    // `row` and `<tbody>` to `rowgroup` — so `getAllByRole('row')` returns the
    // same elements whether or not the attribute is present, and a test written
    // that way passes with the attribute deleted. In a real browser those
    // implicit roles are gone, because `display: flex`/`grid` removes them
    // (ADR-062), which is the whole reason the attributes exist. The attribute
    // is therefore the only thing worth asserting, and the only thing whose
    // deletion this suite can catch.
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

    // Both spacers are present at this scroll offset — the filler is real and
    // is still not announced.
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

    // Window-relative indexing would number the rendered rows 2, 3, 4… — the
    // header being row 1 — regardless of where the window sits.
    expect(first).toBe(100 - OVERSCAN + 2);
    expect(second).toBe(100 - OVERSCAN + 3);
    expect(renderedIndices).not.toContain(2);
  });

  it('ends the row-index sequence exactly where aria-rowcount says it does', async () => {
    render(<Harness />);
    await scrollTo(ROW_HEIGHT * TOTAL_ROWS);

    const renderedIndices = getRenderedRowIndices();
    const lastIndex = renderedIndices.at(-1);

    // The count and the indices are only meaningful against one another: if
    // they are derived from different bases, one of them is wrong and neither
    // rule alone would show it.
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
    // The focused row is unmounted, so no cell can hold the stop — the grid
    // container takes it back rather than leaving the grid with none.
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

    // fireEvent answers false when a handler called preventDefault.
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

    // The proof the criterion is about: the focused node is gone and DOM focus
    // has fallen to the document body, exactly the failure this model exists to
    // survive.
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

    // Tabbing back in scrolls the remembered row into view and focuses it —
    // the grid is one stop in the page's tab order, entered where it was left.
    await enterGrid();
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '4', text: 'City 2' });

    // And navigation continues from there rather than from the top.
    await pressKey({ key: 'ArrowDown' });
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '5', text: 'City 3' });
  });

  it('takes the tab stop from a cell that is clicked into', async () => {
    render(<Harness />);

    const cell = screen.getAllByRole('gridcell')[4];
    // The one `act` outside `flushScroll` that is needed, and needed precisely
    // because this is the only interaction here that does not scroll: nothing
    // awaits `flushScroll` afterwards, so the focus effects have nothing else
    // to be flushed by.
    await act(async () => {
      (cell as HTMLElement).focus();
    });

    expect(getAllTabStops()).toEqual([cell]);
    expect(readFocusedCell()).toEqual({ ariaRowIndex: '3', text: 'City 1' });
  });
});
