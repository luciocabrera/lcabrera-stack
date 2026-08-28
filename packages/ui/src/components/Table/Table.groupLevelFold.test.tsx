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

import type {
  TableColumn,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import {
  TableConfigProvider,
  TableDataProvider,
  TableFocusProvider,
} from '#ui/components/Table/contexts';
import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { useFocusStore } from '#ui/components/Table/contexts/TableFocus/focus/useFocusStore.hook';
import { TableWrapperContext } from '#ui/components/Table/contexts/TableWrapper/TableWrapperContext.context';
import { useTableGroupLevelFold } from '#ui/components/Table/hooks';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { TableBase } from '#ui/components/Table/TableBase';
import { TableBody } from '#ui/components/Table/TableBody';

/**
 * Folding one level of a grouping and leaving the rest alone (#1020), end to
 * end against real stores.
 *
 * The unit tests say which paths a level names. Only a whole grid can say what
 * the reader is left holding: that the outer levels and their subtotals are
 * still on screen, that a level folded from the menu reopens from the chevron
 * on the row that survived it, and that a collapse someone made themselves
 * outlives the action in both directions.
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
 * front (ADR-080) — not the order `columns` declares them in.
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
 * A three-level rollup, in the order rollup emits it — every subtotal after the
 * rows it totals (#570), and the grand total last of all (ADR-065).
 *
 * ```
 * 0  Cancelled Business Critical
 * 1  Cancelled Business High
 * 2  Cancelled Business ·total·
 * 3  Cancelled Retail   Critical
 * 4  Cancelled Retail   ·total·
 * 5  Cancelled ·total·
 * 6  Active    Business Critical
 * 7  Active    Business ·total·
 * 8  Active    ·total·
 * 9  ·total·                        ← keyed by nothing
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
  groupRow({ isSubtotal: true, path: pathOf() }),
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

type LevelFoldControlProps = {
  readonly columnKey: string;
};

/**
 * One column's pair as the header menu wires it — the real hook, so both the
 * enabled states and the "is it offered at all" gate asserted here are the ones
 * the menu items get.
 */
const LevelFoldControl = ({ columnKey }: LevelFoldControlProps) => {
  const {
    hasGroupLevel,
    isCollapseLevelEnabled,
    isExpandLevelEnabled,
    setGroupLevelExpanded,
  } = useTableGroupLevelFold<TestRow>(columnKey);

  if (!hasGroupLevel) return;

  return (
    <>
      <button
        data-testid={`expand-${columnKey}`}
        disabled={!isExpandLevelEnabled}
        onClick={() => {
          setGroupLevelExpanded({ columnKey, isExpanded: true });
        }}
        type='button'
      >
        Expand This Level
      </button>
      <button
        data-testid={`collapse-${columnKey}`}
        disabled={!isCollapseLevelEnabled}
        onClick={() => {
          setGroupLevelExpanded({ columnKey, isExpanded: false });
        }}
        type='button'
      >
        Collapse This Level
      </button>
    </>
  );
};

const FocusReadout = () => {
  const focusTarget = useFocusStore((state) => state);

  return (
    <output data-testid='focus-target'>
      {JSON.stringify({
        rowIndex: focusTarget.rowIndex,
        rowKey: focusTarget.rowKey,
      })}
    </output>
  );
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
            <FocusReadout />
            {GROUPING_KEYS.map((columnKey) => (
              <LevelFoldControl columnKey={columnKey} key={columnKey} />
            ))}
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

const control = (testId: string) =>
  screen.getByTestId(testId) as HTMLButtonElement;

const getGrid = () => screen.getByRole('treegrid');

type CellArgs = {
  readonly index: number;
  readonly row: Element;
};

const cellOf = ({ index, row }: CellArgs) =>
  [...row.querySelectorAll('[role="gridcell"]')][index];

const chevronIn = (args: CellArgs) =>
  cellOf(args)?.querySelector('[data-testid="table-group-disclosure"]');

/**
 * StyleX writes the body's computed total to a custom property rather than to
 * `height`, so that is where the declared height actually lives.
 */
const readBodyHeight = () =>
  screen.getByTestId('table-body').style.getPropertyValue('--x-height');

const getFocusTarget = () =>
  JSON.parse(screen.getByTestId('focus-target').textContent ?? '{}') as {
    readonly rowIndex?: number;
    readonly rowKey?: string;
  };

/**
 * The labels each row actually **draws**, read off the drawn cells rather than
 * `textContent`, which would also collect the visually-hidden restatement a
 * carried level renders (ADR-080).
 */
const drawnLabels = () =>
  getRows().map((row) =>
    [...row.querySelectorAll('[data-testid="table-group-key-cell"]')]
      .map((cell) => cell.textContent?.trim() ?? '')
      .join(' | '),
  );

/** The scroll listener defers through `requestAnimationFrame`; only an awaited act drains it. */
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

/** What the grid draws once the priority level is folded away. */
const WITHOUT_PRIORITY = [
  'Cancelled | Business total',
  'Retail total',
  'Cancelled total',
  'Active | Business total',
  'Active total',
  'Grand total',
];

describe('folding one group level from its column', () => {
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

  it('removes the values its column states and leaves every outer level', () => {
    render(<Harness />);

    expect(getRows()).toHaveLength(10);

    fireEvent.click(control('collapse-priority'));

    // The customer-type blocks and the status blocks are all still on screen
    // with their subtotals; only the priority rows are gone. A collapse-all
    // would have left three rows, and folding the level the column *is* rather
    // than the one above it would have taken the customer-type rows too.
    expect(drawnLabels()).toStrictEqual(WITHOUT_PRIORITY);
  });

  it('restores exactly those rows when the same column expands', () => {
    render(<Harness />);

    fireEvent.click(control('collapse-priority'));
    fireEvent.click(control('expand-priority'));

    expect(getRows()).toHaveLength(10);
  });

  it('reopens a folded level from the surviving row’s own chevron', () => {
    render(<Harness />);

    fireEvent.click(control('collapse-priority'));

    // Row 0 is now `Cancelled Business ·total·`, the row the fold left standing
    // — and the control that undoes it sits in the cell for the level it holds.
    // Without this the action would be a one-way trip out of the data for
    // anyone who closed the menu (ADR-083).
    fireEvent.click(
      chevronIn({
        index: CUSTOMER_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );

    expect(drawnLabels()).toStrictEqual([
      'Cancelled | Business | Critical',
      'High',
      'Business total',
      'Retail total',
      'Cancelled total',
      'Active | Business total',
      'Active total',
      'Grand total',
    ]);
  });

  it('leaves another level’s expansion alone, in both directions', () => {
    render(<Harness />);

    // `Cancelled` is folded by hand first, from the chevron on the row that
    // states it.
    fireEvent.click(
      chevronIn({
        index: STATUS_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );
    expect(drawnLabels()).toStrictEqual([
      'Cancelled total',
      'Active | Business | Critical',
      'Business total',
      'Active total',
      'Grand total',
    ]);

    fireEvent.click(control('collapse-priority'));

    // The hand-made fold survives the level collapse...
    expect(drawnLabels()).toStrictEqual([
      'Cancelled total',
      'Active | Business total',
      'Active total',
      'Grand total',
    ]);

    fireEvent.click(control('expand-priority'));

    // ...and the level expand, which must not open it either. An action that
    // wrote the whole collapsed set rather than its own level would have
    // reopened `Cancelled` here.
    expect(drawnLabels()).toStrictEqual([
      'Cancelled total',
      'Active | Business | Critical',
      'Business total',
      'Active total',
      'Grand total',
    ]);
  });

  it('folds the level above whichever column asks, not always the innermost', () => {
    render(<Harness />);

    fireEvent.click(control('collapse-customerType'));

    // `customerType` is the second key, so this folds the *status* groups —
    // which is the same set of rows "Collapse All Groups" would leave, reached
    // by naming one level rather than every level.
    expect(drawnLabels()).toStrictEqual([
      'Cancelled total',
      'Active total',
      'Grand total',
    ]);
  });

  it('offers nothing on the outermost key, nor on a column that is no key', () => {
    render(<Harness />);

    // Nothing above `status` renders a row, so a fold there could not be undone
    // (ADR-083) — and `id` is not a group key at all.
    expect(screen.queryByTestId('collapse-status')).toBeNull();
    expect(screen.queryByTestId('expand-status')).toBeNull();
    expect(screen.queryByTestId('collapse-id')).toBeNull();
  });

  it('counts the surviving rows, not the loaded ones', () => {
    render(<Harness />);
    fireEvent.click(control('collapse-priority'));

    const grid = screen.getByTestId('table');

    // The header is row 1, so the count is the visible rows plus it — and the
    // body's indices have to land inside it, ending exactly on it.
    expect(grid.getAttribute('aria-rowcount')).toBe('7');
    expect(
      getRows().map((row) => row.getAttribute('aria-rowindex')),
    ).toStrictEqual(['2', '3', '4', '5', '6', '7']);
  });

  it('sizes the body from the surviving rows, in the height it declares', () => {
    render(<Harness />);

    expect(readBodyHeight()).toBe(`${10 * ROW_HEIGHT}px`);

    fireEvent.click(control('collapse-priority'));

    // `<tbody>`'s height and both virtualization spacers come from the same
    // count, so a body still measured against the loaded rows would stand four
    // rows taller than its contents.
    expect(readBodyHeight()).toBe(`${WITHOUT_PRIORITY.length * ROW_HEIGHT}px`);
  });

  it('leaves focus on the row the fold left standing', async () => {
    render(<Harness />);

    await enterGrid();
    await pressKey('ArrowDown');

    // Focus is on `Cancelled / Business / High`, a priority row inside the
    // block about to close — collapsing while focus sits on a surviving row
    // would prove nothing.
    expect(getFocusTarget().rowIndex).toBe(1);

    fireEvent.click(control('collapse-priority'));

    // The claim: focus lands on that row's own customer-type group, the nearest
    // ancestor this fold closed, at its new index. ADR-062's generic rule —
    // nearest survivor at the same absolute index — would have answered the
    // `Cancelled Retail` subtotal, in a different block.
    expect(getFocusTarget().rowIndex).toBe(0);
    expect(getFocusTarget().rowKey).toContain(
      resolveGroupPathKey(pathOf('Cancelled', 'Business')),
    );
  });

  it('leaves focus on the same row when that row survives the fold', async () => {
    render(<Harness />);

    await enterGrid();
    await pressKey('ArrowDown');
    await pressKey('ArrowDown');

    const before = getFocusTarget();

    // Row 2 is the `Cancelled Business` subtotal — the group this fold closes,
    // whose own row a collapse never hides (ADR-067).
    expect(before.rowKey).toContain(
      resolveGroupPathKey(pathOf('Cancelled', 'Business')),
    );

    fireEvent.click(control('collapse-priority'));

    // Nothing is handed anywhere: the row the reader was on is still drawn, so
    // the action must not relocate focus to an ancestor it did not need to.
    expect(getFocusTarget()).toStrictEqual(before);
  });

  it('stops offering each direction once it would do nothing', () => {
    render(<Harness />);

    expect(control('collapse-priority').disabled).toBe(false);
    expect(control('expand-priority').disabled).toBe(true);

    fireEvent.click(control('collapse-priority'));

    expect(control('collapse-priority').disabled).toBe(true);
    expect(control('expand-priority').disabled).toBe(false);

    // The other level is untouched by either, which is what makes the pair
    // per-level rather than a second name for the whole-table pair.
    expect(control('collapse-customerType').disabled).toBe(false);
    expect(control('expand-customerType').disabled).toBe(true);
  });
});
