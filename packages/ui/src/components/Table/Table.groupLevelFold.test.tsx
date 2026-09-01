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

type TestRow = Record<string, unknown>;

const ROW_HEIGHT = 40;
const CONTAINER_HEIGHT = 400;

const GROUPING_KEYS = ['status', 'customerType', 'priority'];

const MENU_COLUMNS = [...GROUPING_KEYS, 'id'];

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'status', label: 'Status' },
  { key: 'customerType', label: 'Customer Type' },
  { key: 'priority', label: 'Priority' },
];

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
            {MENU_COLUMNS.map((columnKey) => (
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

const readBodyHeight = () =>
  screen.getByTestId('table-body').style.getPropertyValue('--x-height');

const getFocusTarget = () =>
  JSON.parse(screen.getByTestId('focus-target').textContent ?? '{}') as {
    readonly rowIndex?: number;
    readonly rowKey?: string;
  };

const drawnLabels = () =>
  getRows().map((row) =>
    [...row.querySelectorAll('[data-testid="table-group-key-cell"]')]
      .map((cell) => cell.textContent?.trim() ?? '')
      .join(' | '),
  );

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

const CUSTOMER_TYPE_FOLDED = [
  'Cancelled | Business total',
  'Retail total',
  'Cancelled total',
  'Active | Business total',
  'Active total',
  'Grand total',
];

const STATUS_FOLDED = ['Cancelled total', 'Active total', 'Grand total'];

const openChevronIn = (index: number) =>
  getRows()
    .map((row) =>
      cellOf({ index, row })?.querySelector(
        '[data-testid="table-group-disclosure"][data-expanded="true"]',
      ),
    )
    .find((chevron) => chevron !== null && chevron !== undefined);

const foldEveryChevronIn = (index: number) => {
  let chevron = openChevronIn(index);

  while (chevron !== undefined) {
    fireEvent.click(chevron);
    chevron = openChevronIn(index);
  }
};

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

  it('folds the groups its own column states, keeping that column’s rows', () => {
    render(<Harness />);

    expect(getRows()).toHaveLength(10);

    fireEvent.click(control('collapse-customerType'));

    expect(drawnLabels()).toStrictEqual(CUSTOMER_TYPE_FOLDED);
  });

  it('folds one group from the chevron in the column that states it', () => {
    render(<Harness />);

    fireEvent.click(
      chevronIn({
        index: CUSTOMER_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );

    expect(drawnLabels()).toStrictEqual([
      'Cancelled | Business total',
      'Retail | Critical',
      'Retail total',
      'Cancelled total',
      'Active | Business | Critical',
      'Business total',
      'Active total',
      'Grand total',
    ]);
  });

  it.each(GROUPING_KEYS)(
    'leaves the grid where every chevron in %s would leave it',
    (columnKey) => {
      const cellIndex = GROUPING_KEYS.indexOf(columnKey);
      const fromMenu = render(<Harness />);

      fireEvent.click(control(`collapse-${columnKey}`));

      const byMenu = drawnLabels();

      fromMenu.unmount();
      render(<Harness />);
      foldEveryChevronIn(cellIndex);

      expect(byMenu).toStrictEqual(drawnLabels());
    },
  );

  it('restores exactly those rows when the same column expands', () => {
    render(<Harness />);

    fireEvent.click(control('collapse-customerType'));
    fireEvent.click(control('expand-customerType'));

    expect(getRows()).toHaveLength(10);
  });

  it('reopens a folded level from the surviving row’s own chevron', () => {
    render(<Harness />);

    fireEvent.click(control('collapse-customerType'));
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

    fireEvent.click(control('collapse-customerType'));

    expect(drawnLabels()).toStrictEqual([
      'Cancelled total',
      'Active | Business total',
      'Active total',
      'Grand total',
    ]);

    fireEvent.click(control('expand-customerType'));

    expect(drawnLabels()).toStrictEqual([
      'Cancelled total',
      'Active | Business | Critical',
      'Business total',
      'Active total',
      'Grand total',
    ]);
  });

  it('folds the groups of whichever column asks, not always the innermost', () => {
    render(<Harness />);

    fireEvent.click(control('collapse-status'));

    expect(drawnLabels()).toStrictEqual(STATUS_FOLDED);
  });

  it('leaves the outermost key’s own rows standing, with a live chevron', () => {
    render(<Harness />);

    fireEvent.click(control('collapse-status'));

    expect(drawnLabels()).toStrictEqual(STATUS_FOLDED);

    fireEvent.click(
      chevronIn({
        index: STATUS_CELL,
        row: getRows()[0] as Element,
      }) as Element,
    );

    expect(drawnLabels()).toStrictEqual([
      'Cancelled | Business | Critical',
      'High',
      'Business total',
      'Retail | Critical',
      'Retail total',
      'Cancelled total',
      'Active total',
      'Grand total',
    ]);
  });

  it('offers the pair on every group key and on no other column', () => {
    render(<Harness />);

    for (const columnKey of GROUPING_KEYS) {
      expect(control(`collapse-${columnKey}`)).not.toBeNull();
      expect(control(`expand-${columnKey}`)).not.toBeNull();
    }

    expect(screen.queryByTestId('collapse-id')).toBeNull();
    expect(screen.queryByTestId('expand-id')).toBeNull();
  });

  it('leaves both inert on the innermost key, whose groups own no rows', () => {
    render(<Harness />);

    expect(control('collapse-priority').disabled).toBe(true);
    expect(control('expand-priority').disabled).toBe(true);
  });

  it('counts the surviving rows, not the loaded ones', () => {
    render(<Harness />);
    fireEvent.click(control('collapse-customerType'));

    const grid = screen.getByTestId('table');

    expect(grid.getAttribute('aria-rowcount')).toBe('7');
    expect(
      getRows().map((row) => row.getAttribute('aria-rowindex')),
    ).toStrictEqual(['2', '3', '4', '5', '6', '7']);
  });

  it('sizes the body from the surviving rows, in the height it declares', () => {
    render(<Harness />);

    expect(readBodyHeight()).toBe(`${10 * ROW_HEIGHT}px`);

    fireEvent.click(control('collapse-customerType'));

    expect(readBodyHeight()).toBe(
      `${CUSTOMER_TYPE_FOLDED.length * ROW_HEIGHT}px`,
    );
  });

  it('leaves focus on the row the fold left standing', async () => {
    render(<Harness />);

    await enterGrid();
    await pressKey('ArrowDown');

    expect(getFocusTarget().rowIndex).toBe(1);

    fireEvent.click(control('collapse-customerType'));

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

    expect(before.rowKey).toContain(
      resolveGroupPathKey(pathOf('Cancelled', 'Business')),
    );

    fireEvent.click(control('collapse-customerType'));

    expect(getFocusTarget()).toStrictEqual(before);
  });

  it('stops offering each direction once it would do nothing', () => {
    render(<Harness />);

    expect(control('collapse-customerType').disabled).toBe(false);
    expect(control('expand-customerType').disabled).toBe(true);

    fireEvent.click(control('collapse-customerType'));

    expect(control('collapse-customerType').disabled).toBe(true);
    expect(control('expand-customerType').disabled).toBe(false);

    expect(control('collapse-status').disabled).toBe(false);
    expect(control('expand-status').disabled).toBe(true);
  });
});
