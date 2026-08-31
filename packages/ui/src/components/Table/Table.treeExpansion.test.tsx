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

type TestRow = Record<string, unknown>;

const ROW_HEIGHT = 40;
const CONTAINER_HEIGHT = 400;

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'city', label: 'City' },
];

const paris: readonly TableGroupKeyValue[] = [
  { columnKey: 'city', label: 'Paris', value: 'Paris' },
];
const berlin: readonly TableGroupKeyValue[] = [
  { columnKey: 'city', label: 'Berlin', value: 'Berlin' },
];

const groupRow = (path: readonly TableGroupKeyValue[]): TestRow => ({
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [],
    count: 3,
    isSubtotal: false,
    path,
  },
});

const rows: readonly TestRow[] = [
  groupRow(paris),
  { city: 'Paris', id: 1 },
  { city: 'Paris', id: 2 },
  { city: 'Paris', id: 3 },
  groupRow(berlin),
  { city: 'Berlin', id: 4 },
  { city: 'Berlin', id: 5 },
];

const resortedRows: readonly TestRow[] = [
  groupRow(berlin),
  { city: 'Berlin', id: 5 },
  { city: 'Berlin', id: 4 },
  groupRow(paris),
  { city: 'Paris', id: 3 },
  { city: 'Paris', id: 2 },
  { city: 'Paris', id: 1 },
];

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
          columnKey: focusTarget.columnKey,
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
        groupingAggregates: [{ columnKey: 'id', fn: 'count' }],
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

const readBodyHeight = () => getBody().style.getPropertyValue('--x-height');

const readPixelValues = (element: Element) =>
  (element.getAttribute('style') ?? '')
    .matchAll(/(\d+)px/g)
    .map(([, value]) => Number(value))
    .toArray();

const getGroupRows = () => screen.getAllByTestId('table-group-header-row');

const getGroupLabels = () =>
  screen.getAllByTestId('table-group-key-cell').map((cell) => cell.textContent);

const getRowKinds = () =>
  getRenderedRows().map((row) =>
    row.dataset.testid === 'table-group-header-row' ? 'group' : 'detail',
  );

const getRenderedRows = () => screen.getAllByRole('row');

const getCollapsedPaths = () =>
  JSON.parse(
    screen.getByTestId('collapsed-paths').textContent ?? '[]',
  ) as readonly string[];

const getFocusTarget = () =>
  JSON.parse(screen.getByTestId('focus-target').textContent ?? '{}') as {
    readonly columnKey?: string;
    readonly rowIndex?: number;
    readonly rowKey?: string;
  };

const getAllTabStops = () => {
  const grid = getGrid();

  return [
    ...(grid.tabIndex === 0 ? [grid] : []),
    ...grid.querySelectorAll('[tabindex="0"]'),
  ];
};

const readFocus = () => {
  const active = document.activeElement;

  if (active === null || active === document.body) return 'body';
  if (active === getGrid()) return 'grid';
  if (active.getAttribute('role') !== 'gridcell')
    return active.tagName.toLowerCase();

  const row = active.closest('tr');
  const kind =
    row?.dataset.testid === 'table-group-header-row' ? 'group' : 'detail';

  return `${kind}#${row?.getAttribute('aria-rowindex') ?? '?'}`;
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
    render(<Harness data={rows} />);

    const tabbable = [
      ...screen.getByRole('treegrid').querySelectorAll('[tabindex="0"]'),
    ];

    expect(tabbable.length).toBeLessThanOrEqual(1);

    for (const chevron of screen.getAllByTestId('table-group-disclosure')) {
      expect(chevron.getAttribute('tabindex')).toBeNull();
      expect(chevron.tagName).not.toBe('BUTTON');
      expect(chevron.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('removes a collapsed group’s rows and puts them back', async () => {
    render(<Harness data={rows} />);

    expect(getRenderedRows()).toHaveLength(7);

    clickButton('toggle-paris');
    expect(getRenderedRows()).toHaveLength(4);
    expect(getGroupLabels()).toStrictEqual(['Paris', 'Berlin']);
    expect(getRowKinds()).toStrictEqual(['group', 'group', 'detail', 'detail']);

    clickButton('toggle-paris');
    expect(getRenderedRows()).toHaveLength(7);
  });

  it('keeps the body’s declared height at one row height per visible row', async () => {
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

    expect(trace).toStrictEqual([
      'group#2',
      'detail#3',
      'detail#4',
      'detail#5',
      'group#6',
    ]);
  });

  it('renumbers the grid over the rows that remain', async () => {
    render(<Harness data={rows} />);

    clickButton('toggle-paris');

    const indices = getRenderedRows().map((row) =>
      Number(row.getAttribute('aria-rowindex')),
    );

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
    render(<RefetchingHarness />);

    clickButton('toggle-paris');
    expect(getRenderedRows()).toHaveLength(4);

    clickButton('resort');

    expect(getRenderedRows()).toHaveLength(4);
    expect(getCollapsedPaths()).toStrictEqual([resolveGroupPathKey(paris)]);
    expect(getGroupLabels()).toStrictEqual(['Berlin', 'Paris']);
    expect(getRowKinds()).toStrictEqual(['group', 'detail', 'detail', 'group']);
  });

  it('drops a path a filter change removed, rather than re-applying it later', async () => {
    render(<RefetchingHarness />);

    clickButton('toggle-paris');
    clickButton('filter-out-paris');

    expect(getCollapsedPaths()).toStrictEqual([]);

    clickButton('restore');

    expect(getRenderedRows()).toHaveLength(7);
    expect(getRowKinds()).toStrictEqual([
      'group',
      'detail',
      'detail',
      'detail',
      'group',
      'detail',
      'detail',
    ]);
  });

  it('expands with Right and collapses with Left, on the group row', async () => {
    render(<Harness data={rows} />);

    await enterGrid();
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

    expect(readFocus()).toBe('detail#3');
    expect(getFocusTarget().columnKey).toBe('city');

    await pressKey('ArrowRight');

    expect(readFocus()).toBe('detail#3');
    expect(getFocusTarget().columnKey).toBe('id:count');
    expect(getCollapsedPaths()).toStrictEqual([]);
  });

  it('moves focus to the ancestor when a collapse removes the focused row', async () => {
    render(<Harness data={rows} />);

    const trace: string[] = [];
    const record = () => {
      trace.push(readFocus());
    };

    await enterGrid();
    await pressKey('ArrowRight');
    record();
    await pressKey('ArrowDown');
    record();
    await pressKey('ArrowDown');
    record();
    await pressKey('ArrowDown');
    record();

    expect(trace).toStrictEqual([
      'group#2',
      'detail#3',
      'detail#4',
      'detail#5',
    ]);

    clickButton('toggle-paris');
    record();

    expect(getFocusTarget().rowIndex).toBe(0);
    expect(getFocusTarget().rowKey).toContain(resolveGroupPathKey(paris));

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

    expect(trace).toStrictEqual([
      'group#2',
      'detail#3',
      'detail#4',
      'detail#5',
      'group#2',
      'group#2',
      'group#3',
      'detail#4',
    ]);
  });

  it('leaves focus alone when the collapse does not remove the focused row', async () => {
    render(<Harness data={rows} />);

    await enterGrid();
    await pressKey('ArrowDown');
    await pressKey('ArrowDown');
    await pressKey('ArrowRight');
    expect(readFocus()).toBe('detail#4');

    const before = getFocusTarget();

    clickButton('toggle-berlin');

    expect(getFocusTarget()).toStrictEqual(before);
    expect(readFocus()).toBe('detail#4');
  });
});
