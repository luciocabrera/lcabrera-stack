// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { useRef, useState } from 'react';
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
import { useToggleTableGroupExpansion } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import { useGetTableCollapsedGroupPaths } from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { useFocusStore } from '#ui/components/Table/contexts/TableFocus/focus/useFocusStore.hook';
import { TableWrapperContext } from '#ui/components/Table/contexts/TableWrapper/TableWrapperContext.context';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { TableBase } from '#ui/components/Table/TableBase';
import { TableBody } from '#ui/components/Table/TableBody';

/**
 * Expansion and treegrid navigation, end to end against real stores (#571).
 *
 * The claims worth a whole-tree test rather than a unit are the ones that only
 * exist once the store, the derived rows, the virtualization window and the
 * focus model are wired to one another: that collapsing changes the row count
 * and not the row height, that a collapse is remembered by path across a
 * refetch, and — the one that is easiest to pass vacuously — that focus lands
 * on the ancestor when a collapse takes the focused row away.
 *
 * That last one is traced after **every** interaction rather than compared
 * before and after, because the failure it guards against is invisible to a
 * before/after: a keypress that is consumed and moves nothing looks identical
 * to one that was never pressed.
 */
type TestRow = Record<string, unknown>;

const ROW_HEIGHT = 40;
const CONTAINER_HEIGHT = 400;

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'city', label: 'City' },
];

const paris: readonly TableGroupKeyValue[] = [
  { columnKey: 'city', label: 'Paris' },
];
const berlin: readonly TableGroupKeyValue[] = [
  { columnKey: 'city', label: 'Berlin' },
];

const groupRow = (path: readonly TableGroupKeyValue[]): TestRow => ({
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [],
    count: 3,
    isSubtotal: false,
    path,
  },
});

/**
 * ```
 * 0  Paris
 * 1    { id: 1 }
 * 2    { id: 2 }
 * 3    { id: 3 }
 * 4  Berlin
 * 5    { id: 4 }
 * 6    { id: 5 }
 * ```
 *
 * Paris deliberately holds three rows and is not the last group: collapsing it
 * with focus on its last row makes the ancestor (index 0) and the row that
 * shifts into the vacated index 3 (`{ id: 5 }`) two different answers, which is
 * what makes the recovery assertion discriminating rather than coincidental.
 */
const rows: readonly TestRow[] = [
  groupRow(paris),
  { city: 'Paris', id: 1 },
  { city: 'Paris', id: 2 },
  { city: 'Paris', id: 3 },
  groupRow(berlin),
  { city: 'Berlin', id: 4 },
  { city: 'Berlin', id: 5 },
];

/** The same rows re-sorted: every group path survives, the order does not. */
const resortedRows: readonly TestRow[] = [
  groupRow(berlin),
  { city: 'Berlin', id: 5 },
  { city: 'Berlin', id: 4 },
  groupRow(paris),
  { city: 'Paris', id: 3 },
  { city: 'Paris', id: 2 },
  { city: 'Paris', id: 1 },
];

/** What a filter that removed Paris returns. */
const filteredRows: readonly TestRow[] = [
  groupRow(berlin),
  { city: 'Berlin', id: 4 },
  { city: 'Berlin', id: 5 },
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
 * The two things a chevron in the hierarchy column will do (#570), exposed as
 * the buttons this suite drives: the expansion action, and the store it writes.
 * Rendered inside the providers so both read the same stores the grid does.
 */
const ExpansionProbe = () => {
  const toggleExpansion = useToggleTableGroupExpansion<TestRow>();
  const collapsedGroupPaths = useGetTableCollapsedGroupPaths();
  const focusTarget = useFocusStore((state) => state);

  return (
    <div>
      <button
        data-testid='toggle-paris'
        onClick={() => {
          toggleExpansion(paris);
        }}
        type='button'
      >
        toggle first
      </button>
      <button
        data-testid='toggle-berlin'
        onClick={() => {
          toggleExpansion(berlin);
        }}
        type='button'
      >
        toggle second
      </button>
      <output data-testid='collapsed-paths'>
        {JSON.stringify([...collapsedGroupPaths])}
      </output>
      <output data-testid='focus-target'>
        {JSON.stringify({
          rowIndex: focusTarget.rowIndex,
          rowKey: focusTarget.rowKey,
        })}
      </output>
    </div>
  );
};

type HarnessProps = {
  readonly data: readonly TestRow[];
};

const Harness = ({ data }: HarnessProps) => {
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
        // A grouped table declares its keys, and that is what injects the
        // hierarchy column a group row puts its label in (ADR-065). Without it
        // the grid would render group rows into data columns only, which is not
        // a state a grouped route can be in.
        groupingKeys: ['city'],
        overscan: 2,
        rowHeight: ROW_HEIGHT,
      }}
    >
      <TableFocusProvider>
        <TableDataProvider<TestRow>
          dataState={{
            data,
            isLoading: false,
            isLoadingMore: false,
            totalRows: data.length,
          }}
        >
          <TableWrapperContext value={{ containerRef, wrapperRef }}>
            <div data-testid='scroll-container' ref={setContainer}>
              <TableBase>
                <TableBody tableContainerRef={containerRef} />
              </TableBase>
            </div>
            <ExpansionProbe />
          </TableWrapperContext>
        </TableDataProvider>
      </TableFocusProvider>
    </TableConfigProvider>
  );
};

/** A refetch: the provider re-seeds the data store from a new array. */
const RefetchingHarness = () => {
  const [data, setData] = useState(rows);

  return (
    <>
      <button
        data-testid='resort'
        onClick={() => {
          setData(resortedRows);
        }}
        type='button'
      >
        Sort
      </button>
      <button
        data-testid='filter-out-paris'
        onClick={() => {
          setData(filteredRows);
        }}
        type='button'
      >
        Filter
      </button>
      <button
        data-testid='restore'
        onClick={() => {
          setData(rows);
        }}
        type='button'
      >
        Restore
      </button>
      <Harness data={data} />
    </>
  );
};

const getGrid = () => screen.getByRole('treegrid');

const getBody = () => screen.getByTestId('table-body');

/**
 * StyleX writes the body's computed total to a custom property rather than to
 * `height`, so that is where the declared height actually lives.
 */
const readBodyHeight = () => getBody().style.getPropertyValue('--x-height');

/**
 * Every pixel value StyleX wrote onto one element, as numbers.
 *
 * `TableRow` declares `height`, `minHeight` and `maxHeight` from one dynamic
 * style, so a row that paints at the row height reports that number three
 * times — and reading all three is what makes the clamp itself checkable,
 * rather than only the nominal height.
 */
const readPixelValues = (element: Element) =>
  (element.getAttribute('style') ?? '')
    .matchAll(/(\d+)px/g)
    .map(([, value]) => Number(value))
    .toArray();

const getGroupRows = () => screen.getAllByTestId('table-group-header-row');

/**
 * The hierarchy label of every rendered group row, in order.
 *
 * Queried in place of the bare city text these assertions used to read. Since
 * ADR-065 the city column is a **group key**, so it blanks on the detail rows
 * and the only place the value appears is the group row's own label — a
 * `getAllByText('Paris')` would now count one element whatever the collapse
 * did, and could not fail.
 */
const getGroupLabels = () =>
  screen.getAllByTestId('table-group-label').map((label) => label.textContent);

/**
 * The `Id` cell of every rendered **detail** row, in order. `id` is not a group
 * key, so it still renders — and it is what says which rows a collapse removed.
 */
const getDetailIds = () =>
  getRenderedRows()
    .filter((row) => row.dataset.testid !== 'table-group-header-row')
    .map((row) => row.querySelectorAll('[role="gridcell"]')[1]?.textContent);

const getRenderedRows = () => screen.getAllByRole('row');

const getCollapsedPaths = () =>
  JSON.parse(
    screen.getByTestId('collapsed-paths').textContent ?? '[]',
  ) as readonly string[];

const getFocusTarget = () =>
  JSON.parse(screen.getByTestId('focus-target').textContent ?? '{}') as {
    readonly rowIndex?: number;
    readonly rowKey?: string;
  };

/** The whole grid's tab stops, the container itself included. */
const getAllTabStops = () => {
  const grid = getGrid();

  return [
    ...(grid.tabIndex === 0 ? [grid] : []),
    ...grid.querySelectorAll('[tabindex="0"]'),
  ];
};

/**
 * Where DOM focus actually is, named so a sequence of them reads as a trace.
 * `grid` and `body` are real answers, not failures to read one: a focus target
 * whose row renders no cell leaves focus on the container or, once that row is
 * removed, on the document.
 */
const readFocus = () => {
  const active = document.activeElement;

  if (active === null || active === document.body) return 'body';
  if (active === getGrid()) return 'grid';
  if (active.getAttribute('role') === 'gridcell')
    return active.textContent ?? '';

  return active.tagName.toLowerCase();
};

const flushFrame = async () => {
  await act(async () => {
    screen.getByTestId('scroll-container').dispatchEvent(new Event('scroll'));
  });
};

const pressKey = async (key: string) => {
  fireEvent.keyDown(document.activeElement ?? getGrid(), { key });
  await flushFrame();
};

const enterGrid = async () => {
  getGrid().focus();
  await flushFrame();
};

/**
 * Deliberately synchronous, unlike the two helpers above, and the difference is
 * not an oversight.
 *
 * `pressKey`/`enterGrid` await `flushFrame` because the scroll listener defers
 * its state update through `requestAnimationFrame`, so nothing but an awaited
 * `act` drains it. A click has no such deferral: it writes the stores, and
 * Testing Library already wraps `fireEvent` in a synchronous `act`, which
 * flushes the re-render and the effects that follow it.
 *
 * Checked rather than assumed, because the two facts point opposite ways: with
 * both the `act` and the `await` removed the suite passes, and the assertions
 * that prove it sit on the line **after** the call with nothing between them —
 * `clickButton('toggle-paris')` then `expect(getRenderedRows()).toHaveLength(4)`
 * reads a DOM that has already collapsed. There is no Suspense in this harness
 * for an awaited `act` to serve.
 */
/** The disclosure chevron of the nth rendered group row. */
const chevronOf = (index: number) =>
  screen
    .getAllByTestId('table-group-header-row')
    [index]?.querySelector('[data-testid="table-group-disclosure"]') as
    | HTMLElement
    | undefined;

const clickButton = (testId: string) => {
  fireEvent.click(screen.getByTestId(testId));
};

describe('a grouped table that expands and collapses', () => {
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

  it('folds a group when its own disclosure chevron is clicked', () => {
    // The pointer path, end to end in a real grid. Every other test here drives
    // expansion through the harness button or the arrow keys, so none of them
    // would notice the chevron being unwired, mispointed at another group, or
    // absent altogether.
    render(<Harness data={rows} />);

    expect(getRenderedRows()).toHaveLength(7);

    const [parisRow] = screen.getAllByTestId('table-group-header-row');
    const chevron = parisRow?.querySelector(
      '[data-testid="table-group-disclosure"]',
    );

    fireEvent.click(chevron as Element);

    expect(getRenderedRows()).toHaveLength(4);
    expect(getGroupLabels()).toStrictEqual(['Paris', 'Berlin']);

    fireEvent.click(
      screen
        .getAllByTestId('table-group-header-row')[0]
        ?.querySelector('[data-testid="table-group-disclosure"]') as Element,
    );

    expect(getRenderedRows()).toHaveLength(7);
  });

  it('points the chevron the way its group is currently folded', () => {
    render(<Harness data={rows} />);

    expect(chevronOf(0)?.dataset.expanded).toBe('true');

    clickButton('toggle-paris');

    expect(chevronOf(0)?.dataset.expanded).toBe('false');
  });

  it('adds no tab stop to the grid', () => {
    // ADR-062 gives the grid exactly one roving tab stop. A chevron rendered as
    // a <button> would put a second one inside a cell that already owns one, so
    // this asserts the count over a real grouped body rather than over the
    // component alone — the only place the regression would show.
    render(<Harness data={rows} />);

    const tabbable = [
      ...screen.getByRole('treegrid').querySelectorAll('[tabindex="0"]'),
    ];

    expect(tabbable.length).toBeLessThanOrEqual(1);

    for (const chevron of screen.getAllByTestId('table-group-disclosure')) {
      expect(chevron.getAttribute('tabindex')).toBeNull();
      expect(chevron.tagName).not.toBe('BUTTON');
      // The row already carries `aria-expanded`; announcing it here too would
      // state the same thing twice to a screen reader.
      expect(chevron.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('removes a collapsed group’s rows and puts them back', async () => {
    render(<Harness data={rows} />);

    expect(getRenderedRows()).toHaveLength(7);

    clickButton('toggle-paris');
    // Paris survives, its three rows do not, and Berlin's branch is untouched.
    expect(getRenderedRows()).toHaveLength(4);
    expect(getGroupLabels()).toStrictEqual(['Paris', 'Berlin']);
    expect(getDetailIds()).toStrictEqual(['4', '5']);

    clickButton('toggle-paris');
    expect(getRenderedRows()).toHaveLength(7);
  });

  it('keeps the body’s declared height at one row height per visible row', async () => {
    // The virtualization invariant, in both states: collapsing changes the row
    // count, never the row height (`TableRow` pins min/max height), so the body
    // and its contents cannot drift apart.
    render(<Harness data={rows} />);

    expect(readBodyHeight()).toBe(`${rows.length * ROW_HEIGHT}px`);

    clickButton('toggle-paris');
    expect(getRenderedRows()).toHaveLength(4);
    expect(readBodyHeight()).toBe(`${4 * ROW_HEIGHT}px`);

    clickButton('toggle-berlin');
    expect(getRenderedRows()).toHaveLength(2);
    expect(readBodyHeight()).toBe(`${2 * ROW_HEIGHT}px`);
  });

  it('paints every visible row at the row height while a subtree is collapsed', async () => {
    // The composition #570 and #571 have to survive together: a group row now
    // carries real cells — a hierarchy label that can ellipsize, and one
    // aggregate cell per column (ADR-065) — and a collapse changes how many
    // rows the body is sized for (ADR-067). The invariant is that the two
    // never drift: offsetY + painted rows + bottom spacer === the declared
    // height, with every painted row at exactly one row height.
    render(<Harness data={rows} />);

    clickButton('toggle-paris');

    const allRows = [...getBody().querySelectorAll('tr')];
    const spacers = allRows.filter(
      (row) => row.getAttribute('aria-hidden') === 'true',
    );
    const painted = allRows.filter(
      (row) => row.getAttribute('aria-hidden') !== 'true',
    );

    expect(painted).toHaveLength(4);

    for (const row of painted) {
      // height, minHeight and maxHeight — a label allowed to wrap would be a
      // clipped row rather than a taller one, so the clamp is the guarantee.
      expect(readPixelValues(row)).toStrictEqual([
        ROW_HEIGHT,
        ROW_HEIGHT,
        ROW_HEIGHT,
      ]);
    }

    const spacerHeight = spacers.reduce(
      (total, spacer) => total + (readPixelValues(spacer)[0] ?? 0),
      0,
    );

    expect(spacerHeight + painted.length * ROW_HEIGHT).toBe(
      Number(readBodyHeight().replace('px', '')),
    );
  });

  it('walks focus across group boundaries with a subtree collapsed', async () => {
    // The per-press trace the two slices have to agree on: every row is a stop,
    // group rows included (#651 closes because they own cells now), and a
    // collapsed group's rows are not stops at all because they are not rendered
    // — the same index space the height above is computed from.
    render(<Harness data={rows} />);

    clickButton('toggle-berlin');

    const trace: string[] = [];

    await enterGrid();
    await pressKey('ArrowRight');
    trace.push(readFocus());

    for (let step = 0; step < 4; step += 1) {
      await pressKey('ArrowDown');
      trace.push(readFocus());
    }

    // Paris (a group row's own `Id` cell), its three rows, then Berlin —
    // collapsed, so its two rows are absent and the last ArrowDown clamps
    // there rather than walking into them.
    expect(trace).toStrictEqual([
      '—No aggregate',
      '1',
      '2',
      '3',
      '—No aggregate',
    ]);
  });

  it('renumbers the grid over the rows that remain', async () => {
    render(<Harness data={rows} />);

    clickButton('toggle-paris');

    const indices = getRenderedRows().map((row) =>
      Number(row.getAttribute('aria-rowindex')),
    );

    // Continuous and 1-based with the header at 1, and ending exactly on the
    // count the grid advertises — the two are only meaningful against each
    // other.
    expect(indices).toStrictEqual([2, 3, 4, 5]);
    expect(getGrid().getAttribute('aria-rowcount')).toBe('5');
  });

  it('states the collapse on the group row itself', async () => {
    render(<Harness data={rows} />);

    expect(getGroupRows()[0]?.getAttribute('aria-expanded')).toBe('true');

    clickButton('toggle-paris');
    expect(getGroupRows()[0]?.getAttribute('aria-expanded')).toBe('false');
  });

  it('keys the collapse by group path, not by row index', async () => {
    render(<Harness data={rows} />);

    clickButton('toggle-paris');

    expect(getCollapsedPaths()).toStrictEqual([resolveGroupPathKey(paris)]);
  });

  it('survives a sort change that reorders every row', async () => {
    // Sorting reorders rows without changing any group's key values, so a
    // path-keyed collapse is re-applied to the same group under a different
    // index. An index-keyed one would reopen Paris and close Berlin instead.
    render(<RefetchingHarness />);

    clickButton('toggle-paris');
    expect(getRenderedRows()).toHaveLength(4);

    clickButton('resort');

    expect(getRenderedRows()).toHaveLength(4);
    expect(getCollapsedPaths()).toStrictEqual([resolveGroupPathKey(paris)]);
    // Berlin is first now and still open; Paris is last and still closed.
    expect(getGroupLabels()).toStrictEqual(['Berlin', 'Paris']);
    expect(getDetailIds()).toStrictEqual(['5', '4']);
  });

  it('drops a path a filter change removed, rather than re-applying it later', async () => {
    render(<RefetchingHarness />);

    clickButton('toggle-paris');
    clickButton('filter-out-paris');

    // Nothing left to hide, so nothing is remembered.
    expect(getCollapsedPaths()).toStrictEqual([]);

    clickButton('restore');

    // The discriminating half: a collapse kept from data that no longer existed
    // would silently re-close Paris the moment the filter let it back.
    expect(getRenderedRows()).toHaveLength(7);
    expect(getDetailIds()).toStrictEqual(['1', '2', '3', '4', '5']);
  });

  it('expands with Right and collapses with Left, on the group row', async () => {
    render(<Harness data={rows} />);

    await enterGrid();
    // Focus enters on the first row, which is the Paris group row.
    expect(getFocusTarget().rowIndex).toBe(0);

    await pressKey('ArrowLeft');
    expect(getRenderedRows()).toHaveLength(4);
    expect(getCollapsedPaths()).toStrictEqual([resolveGroupPathKey(paris)]);

    await pressKey('ArrowRight');
    expect(getRenderedRows()).toHaveLength(7);
    expect(getCollapsedPaths()).toStrictEqual([]);
  });

  it('leaves a detail row’s horizontal keys as cell navigation', async () => {
    render(<Harness data={rows} />);

    await enterGrid();
    await pressKey('ArrowDown');

    // The first cell of every row is now the grid's hierarchy column, and a
    // detail row's is empty: its values are already in their own columns
    // (ADR-065).
    expect(readFocus()).toBe('');

    await pressKey('ArrowRight');

    // Moved one cell — onto this row's `Id` — and collapsed nothing.
    expect(readFocus()).toBe('1');
    expect(getCollapsedPaths()).toStrictEqual([]);
  });

  it('moves focus to the ancestor when a collapse removes the focused row', async () => {
    render(<Harness data={rows} />);

    const trace: string[] = [];
    const record = () => {
      trace.push(readFocus());
    };

    await enterGrid();
    // One column right of the hierarchy column, onto `Id`: it is the only
    // column that renders on both kinds of row here, so a trace read there
    // names which row focus is on rather than reading blank down the tree.
    await pressKey('ArrowRight');
    record();
    await pressKey('ArrowDown');
    record();
    await pressKey('ArrowDown');
    record();
    await pressKey('ArrowDown');
    record();

    // Focus is on the last row of Paris — inside the subtree about to close,
    // which is the whole point: collapsing while focus sits elsewhere proves
    // nothing. The first entry is the Paris group row's own `Id` cell: no
    // aggregate was selected on that column, so it renders the dash.
    expect(trace).toStrictEqual(['—No aggregate', '1', '2', '3']);

    clickButton('toggle-paris');
    record();

    // The claim: the focus target is the collapsed group row, at its new index.
    // The generic rule ADR-062 states for a vanished row would have answered
    // index 3 — `{ id: 5 }`, a row in the *other* group.
    expect(getFocusTarget().rowIndex).toBe(0);
    expect(getFocusTarget().rowKey).toContain(resolveGroupPathKey(paris));

    // And the grid is still exactly one stop in the page's tab order, so the
    // user can Tab back into it rather than being dropped out of the table.
    // That stop is now the collapsed group row's own cell rather than the
    // container: the row survives the collapse and, since ADR-065, has cells
    // for the tab stop to sit on — so Tab returns the user to the row they
    // just closed instead of to the top of the grid.
    const stops = getAllTabStops();

    expect(stops).toHaveLength(1);
    expect(stops[0]?.getAttribute('role')).toBe('gridcell');
    expect(stops[0]?.closest('tr')?.dataset.testid).toBe(
      'table-group-header-row',
    );

    await enterGrid();
    record();
    await pressKey('ArrowDown');
    record();
    await pressKey('ArrowDown');
    record();

    // Every dash is a group row read at the `Id` column — no aggregate was
    // selected there, so it renders one. Three of these four entries used to
    // be something else, and all three change for the same reason (#651): a
    // one-cell banner registered no cell for any column key, so no node
    // answered the outstanding focus request. Entry 5 was `body` — the
    // collapse left DOM focus on the document, because the row it recovered to
    // had nothing to receive it; entries 6 and 7 were `grid`, the container
    // keeping a stop no cell would take. ADR-065 gives a group row real cells,
    // so the recovery now lands on the collapsed row itself and stays there.
    //
    // Navigation still continues from the ancestor, which is what the last
    // entry proves: two rows below Paris is `{ id: 4 }`. From `{ id: 5 }` — the
    // index-based answer — two ArrowDowns clamp at the last row and read `5`.
    expect(trace).toStrictEqual([
      '—No aggregate',
      '1',
      '2',
      '3',
      '—No aggregate',
      '—No aggregate',
      '—No aggregate',
      '4',
    ]);
  });

  it('leaves focus alone when the collapse does not remove the focused row', async () => {
    render(<Harness data={rows} />);

    await enterGrid();
    await pressKey('ArrowDown');
    await pressKey('ArrowDown');
    await pressKey('ArrowRight');
    expect(readFocus()).toBe('2');

    const before = getFocusTarget();

    // Berlin's subtree does not contain the focused row, so nothing moves.
    clickButton('toggle-berlin');

    expect(getFocusTarget()).toStrictEqual(before);
    expect(readFocus()).toBe('2');
  });
});
