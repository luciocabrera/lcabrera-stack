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
import { useTableGroupFoldAll } from '#ui/components/Table/hooks';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { TableBase } from '#ui/components/Table/TableBase';
import { TableBody } from '#ui/components/Table/TableBody';

/**
 * Opening and closing every group in one action (#774), end to end against real
 * stores.
 *
 * The unit tests say which paths are foldable. Only a whole grid can say what
 * the reader is left holding: that a collapse-all stops at the outermost level
 * rather than emptying the table, that the row count and the body's height
 * follow the rows that survive rather than the rows that loaded, and that the
 * collapse outlives the next read.
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

/** The same result read back in the opposite order — what a sort change produces. */
const resorted: readonly TestRow[] = [
  groupRow({ path: pathOf('Active', 'Business', 'Critical') }),
  groupRow({ isSubtotal: true, path: pathOf('Active', 'Business') }),
  groupRow({ isSubtotal: true, path: pathOf('Active') }),
  groupRow({ path: pathOf('Cancelled', 'Retail', 'Critical') }),
  groupRow({ isSubtotal: true, path: pathOf('Cancelled', 'Retail') }),
  groupRow({ path: pathOf('Cancelled', 'Business', 'Critical') }),
  groupRow({ path: pathOf('Cancelled', 'Business', 'High') }),
  groupRow({ isSubtotal: true, path: pathOf('Cancelled', 'Business') }),
  groupRow({ isSubtotal: true, path: pathOf('Cancelled') }),
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

/**
 * The pair as the header menu wires it — the real hook, so the enabled states
 * asserted here are the ones the menu items get.
 */
const FoldAllControls = () => {
  const { isCollapseAllEnabled, isExpandAllEnabled, setAllGroupsExpanded } =
    useTableGroupFoldAll<TestRow>();
  const focusTarget = useFocusStore((state) => state);

  return (
    <>
      <output data-testid='focus-target'>
        {JSON.stringify({
          rowIndex: focusTarget.rowIndex,
          rowKey: focusTarget.rowKey,
        })}
      </output>
      <button
        data-testid='expand-all'
        disabled={!isExpandAllEnabled}
        onClick={() => {
          setAllGroupsExpanded(true);
        }}
        type='button'
      >
        Expand All Groups
      </button>
      <button
        data-testid='collapse-all'
        disabled={!isCollapseAllEnabled}
        onClick={() => {
          setAllGroupsExpanded(false);
        }}
        type='button'
      >
        Collapse All Groups
      </button>
    </>
  );
};

type HarnessProps = {
  readonly data?: readonly TestRow[];
};

const Harness = ({ data = rows }: HarnessProps) => {
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
            data,
            isLoading: false,
            isLoadingMore: false,
            totalRows: data.length,
          }}
        >
          <TableWrapperContext value={{ containerRef, wrapperRef }}>
            <FoldAllControls />
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

const control = (testId: 'collapse-all' | 'expand-all') =>
  screen.getByTestId(testId) as HTMLButtonElement;

const getGrid = () => screen.getByRole('treegrid');

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

describe('folding every group at once', () => {
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

  it('collapses to the outermost level, never to nothing', () => {
    render(<Harness />);

    expect(getRows()).toHaveLength(10);

    fireEvent.click(control('collapse-all'));

    // Every level below the top is folded away, and the top-level subtotals
    // survive their **own** collapse: a collapse hides a group's descendants,
    // never its row. The grand total survives because it is nobody's
    // descendant. A set built from the grouping *configuration* rather than
    // from the tree would name levels this result never populated, and
    // `pruneCollapsedGroupPaths` would drop them on the next read.
    expect(drawnLabels()).toStrictEqual([
      'Cancelled total',
      'Active total',
      'Grand total',
    ]);
  });

  it('opens every group again, including levels folded one at a time', () => {
    render(<Harness />);

    fireEvent.click(control('collapse-all'));
    fireEvent.click(control('expand-all'));

    expect(getRows()).toHaveLength(10);
  });

  it('counts the surviving rows, not the loaded ones', () => {
    render(<Harness />);
    fireEvent.click(control('collapse-all'));

    const grid = screen.getByTestId('table');

    // The largest single change the grid can make to its visible set, which is
    // where an off-by-one would show: the count and the last row's index have
    // to meet.
    // The header is row 1, so the count is the visible rows plus it — and the
    // body's indices have to land inside it, ending exactly on it.
    expect(grid.getAttribute('aria-rowcount')).toBe('4');
    expect(
      getRows().map((row) => row.getAttribute('aria-rowindex')),
    ).toStrictEqual(['2', '3', '4']);
  });

  it('keeps the collapse across a re-read that reorders the rows', () => {
    const { rerender } = render(<Harness />);

    fireEvent.click(control('collapse-all'));
    rerender(<Harness data={resorted} />);

    // Expansion is keyed by path, so a sort — which changes every group's
    // position and no group's key values — must leave all of it standing
    // (ADR-061). Asserted after a collapse-*all*, where every level is folded
    // at once and a single surviving path would hide the failure.
    expect(drawnLabels()).toStrictEqual([
      'Active total',
      'Cancelled total',
      'Grand total',
    ]);
  });

  it('stops offering the collapse once there is nothing left to fold', () => {
    render(<Harness />);

    expect(control('collapse-all').disabled).toBe(false);
    expect(control('expand-all').disabled).toBe(true);

    fireEvent.click(control('collapse-all'));

    expect(control('collapse-all').disabled).toBe(true);
    expect(control('expand-all').disabled).toBe(false);
  });
  it('sizes the body from the surviving rows, in the height it declares', () => {
    render(<Harness />);

    expect(readBodyHeight()).toBe(`${10 * ROW_HEIGHT}px`);

    fireEvent.click(control('collapse-all'));

    // The invariant a collapse-all is the hardest case for: `<tbody>`'s height
    // and both spacers come from the same count, so a body still measured
    // against the loaded rows would stand seven rows taller than its contents.
    expect(readBodyHeight()).toBe(`${3 * ROW_HEIGHT}px`);
  });

  it('leaves focus on the surviving ancestor of the row it folded away', async () => {
    render(<Harness />);

    await enterGrid();
    await pressKey('ArrowDown');
    await pressKey('ArrowDown');

    // Focus is on `Cancelled / Business / ·total·`, three levels in and inside
    // the subtree about to close — collapsing while focus sits elsewhere would
    // prove nothing.
    expect(getFocusTarget().rowIndex).toBe(2);

    fireEvent.click(control('collapse-all'));

    // The claim: focus lands on that row's own top-level group, at its new
    // index. ADR-062's generic rule — nearest survivor at the same absolute
    // index — would have answered index 2, the grand total, which is in no
    // sense where the reader was.
    expect(getFocusTarget().rowIndex).toBe(0);
    expect(getFocusTarget().rowKey).toContain(
      resolveGroupPathKey(pathOf('Cancelled')),
    );
  });
});
