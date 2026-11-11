// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { use } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { GlobalSettingsProvider } from '#ui/contexts/GlobalSettingsContext';
import { GlobalSettingsContext } from '#ui/contexts/GlobalSettingsContext/GlobalSettingsContext.context';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { NotificationContext } from '#ui/contexts/NotificationContext/NotificationContext.context';
import { groupedColumnAxisFixture } from '#ui/utils/tests/groupedColumnAxisFixture.util';
import { hasStylexStyle } from '#ui/utils/tests/hasStylexStyle.util';

import type {
  ColumnSizingState,
  TableColumn,
  TableFeatures,
  TableGroupingState,
  TableLayoutMode,
  TableMetaState,
} from './Table.types';

import { FiltersDataProvider } from './contexts/FiltersData';
import { TableConfigProvider } from './contexts/TableConfig';
import { TableOwnStackContext } from './contexts/TableConfig/TableOwnStackContext.context';
import { TablePresentationContext } from './contexts/TableConfig/TablePresentationContext.context';
import { TableFocusProvider } from './contexts/TableFocus';
import { Table } from './Table.component';
import { DEFAULT_MIN_COLUMN_WIDTH } from './Table.constants';
import { styles as flexWrapperStyles } from './Table.stylex';
import { tableBodyCellStyles } from './TableBodyCell/TableBodyCell.stylex';
import { tableHeaderBandStyles } from './TableHeaderBand/TableHeaderBand.stylex';
import { tableHeaderCellStyles } from './TableHeaderCell/TableHeaderCell.stylex';
import { tableStaticContentStyles as staticContentStyles } from './TableStaticContent/TableStaticContent.stylex';

type Score = {
  readonly id: number;
  readonly name: string;
};

const ROWS: readonly Score[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
];

const COLUMNS: readonly TableColumn<Score>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { dataType: 'string', key: 'name', label: 'Name' },
];

beforeAll(() => {
  Object.assign(HTMLElement.prototype, {
    hidePopover: () => undefined,
    scrollTo: () => undefined,
    showPopover: () => undefined,
  });
});

afterEach(cleanup);

const ancestorsOf = (element: Element): readonly Element[] => {
  const { parentElement } = element;

  return parentElement === null
    ? []
    : [parentElement, ...ancestorsOf(parentElement)];
};

const headerOf = (label: string) => {
  const header = screen.getByText(label).closest('th');

  if (header === null) throw new Error(`no ${label} header`);

  return header;
};

type StackArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly features?: TableFeatures;
  readonly groupingState?: Partial<TableGroupingState>;
  readonly layout?: TableLayoutMode;
  readonly metaState?: Partial<TableMetaState>;
  readonly rows: readonly TData[];
};

const renderInStack = <TData extends Record<string, unknown>>({
  columns,
  features,
  groupingState,
  layout = 'static',
  metaState,
  rows,
}: StackArgs<TData>) =>
  render(
    <NotificationProvider>
      <TableConfigProvider<TData>
        columnsState={{ columns: [...columns] }}
        groupingState={groupingState}
        metaState={metaState}
      >
        <TableFocusProvider>
          <FiltersDataProvider<TData> columns={[...columns]}>
            <TableOwnStackContext value>
              <Table<TData, readonly TData[]>
                columns={columns}
                dataSelector={(response) => response}
                features={features}
                layout={layout}
                response={rows}
              />
            </TableOwnStackContext>
          </FiltersDataProvider>
        </TableFocusProvider>
      </TableConfigProvider>
    </NotificationProvider>,
  );

describe('Table static layout chrome', () => {
  it('renders no title bar, icon included, with the toolbar off', () => {
    render(
      <Table
        columns={COLUMNS}
        icon={<span data-testid='table-icon' />}
        layout='static'
        response={ROWS}
      />,
    );

    expect(screen.queryByTestId('table-icon')).toBeNull();
  });

  it('renders the title bar with the toolbar on', () => {
    render(
      <Table
        columns={COLUMNS}
        features={{ toolbar: true }}
        icon={<span data-testid='table-icon' />}
        layout='static'
        response={ROWS}
      />,
    );

    expect(screen.getByTestId('table-icon')).toBeDefined();
  });

  it('is square unless the meta state rounds it', () => {
    render(<Table columns={COLUMNS} layout='static' response={ROWS} />);

    const wrapper = screen.getByTestId('table-scroll-container').parentElement;

    expect(wrapper).not.toBeNull();
    expect(
      hasStylexStyle({
        element: wrapper ?? document.body,
        style: staticContentStyles.rounded,
      }),
    ).toBe(false);
  });

  it('wraps a virtual table in the flex wrapper by default, and a static one not', () => {
    render(<Table columns={COLUMNS} response={ROWS} />);

    const isWrapped = ancestorsOf(screen.getByTestId('table')).some((element) =>
      hasStylexStyle({ element, style: flexWrapperStyles.wrapper }),
    );

    cleanup();
    render(<Table columns={COLUMNS} layout='static' response={ROWS} />);

    const isStaticWrapped = ancestorsOf(screen.getByTestId('table')).some(
      (element) =>
        hasStylexStyle({ element, style: flexWrapperStyles.wrapper }),
    );

    expect([isWrapped, isStaticWrapped]).toStrictEqual([true, false]);
  });

  it('leaves Manage Column out of the column menu while settings are off', () => {
    render(
      <Table
        columns={COLUMNS}
        features={{ columnMenu: true }}
        layout='static'
        response={ROWS}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Name column actions' }),
    );

    expect(screen.queryByText('Manage Column')).toBeNull();
  });

  it('offers Manage Column once settings are on too', () => {
    render(
      <Table
        columns={COLUMNS}
        features={{ columnMenu: true, settings: true }}
        layout='static'
        response={ROWS}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Name column actions' }),
    );

    expect(screen.getByText('Manage Column')).toBeDefined();
  });
});

describe('Table static layout body states', () => {
  it('renders the empty state for no rows', () => {
    render(<Table columns={COLUMNS} layout='static' response={[]} />);

    expect(
      screen.getByTestId('table-body').querySelector('td[colspan]'),
    ).not.toBeNull();
  });

  it('renders no empty state while loading', () => {
    render(<Table columns={COLUMNS} isLoading layout='static' response={[]} />);

    expect(
      screen.getByTestId('table-body').querySelector('td[colspan]'),
    ).toBeNull();
  });
});

describe('Table column width in the virtual layout', () => {
  it('starts an unsized column at its declared width', () => {
    render(
      <Table
        columns={[
          { isPrimaryKey: true, key: 'id', label: 'Id' },
          { key: 'name', label: 'Name', width: 140 },
        ]}
        response={ROWS}
      />,
    );

    expect(headerOf('Name').style.getPropertyValue('--x-width')).toBe('140px');
  });

  it('grows an unsized fill column, and not one with a stored size', () => {
    const columns: readonly TableColumn<Score>[] = [
      { isPrimaryKey: true, key: 'id', label: 'Id' },
      { key: 'name', label: 'Name', width: 'fill' },
    ];

    render(<Table columns={columns} response={ROWS} />);

    expect(
      hasStylexStyle({
        element: headerOf('Name'),
        style: tableHeaderCellStyles.fill,
      }),
    ).toBe(true);

    cleanup();
    render(
      <TableConfigProvider<Score>
        columnsState={{
          columns: [...columns],
          columnSizing: { name: 200 } as ColumnSizingState<Score>,
        }}
      >
        <TableFocusProvider>
          <FiltersDataProvider<Score> columns={[...columns]}>
            <NotificationProvider>
              <TableOwnStackContext value>
                <Table<Score, readonly Score[]>
                  columns={columns}
                  dataSelector={(response) => response}
                  response={ROWS}
                />
              </TableOwnStackContext>
            </NotificationProvider>
          </FiltersDataProvider>
        </TableFocusProvider>
      </TableConfigProvider>,
    );

    expect(
      hasStylexStyle({
        element: headerOf('Name'),
        style: tableHeaderCellStyles.fill,
      }),
    ).toBe(false);
  });
});

const DISPLAY_TAB_OPEN = {
  isTableSettingsOpen: true,
  isTableSettingsPinned: true,
  tableSettingsSelectedTab: 'display',
} as const;

describe('Table static layout inside a provided stack', () => {
  it('opens no settings drawer the meta state asks for while settings are off', () => {
    renderInStack({
      columns: COLUMNS,
      metaState: DISPLAY_TAB_OPEN,
      rows: ROWS,
    });

    expect(screen.queryAllByRole('radio', { name: 'Spacious' })).toHaveLength(
      0,
    );
  });

  it('opens no settings drawer in the virtual layout either while settings are off', () => {
    renderInStack({
      columns: COLUMNS,
      features: { settings: false },
      layout: 'virtual',
      metaState: DISPLAY_TAB_OPEN,
      rows: ROWS,
    });

    expect(screen.queryAllByRole('radio', { name: 'Spacious' })).toHaveLength(
      0,
    );
  });

  it('opens it once settings are on', () => {
    renderInStack({
      columns: COLUMNS,
      features: { settings: true },
      metaState: DISPLAY_TAB_OPEN,
      rows: ROWS,
    });

    expect(
      screen.getAllByRole('radio', { name: 'Spacious' }).length,
    ).toBeGreaterThan(0);
  });

  it('paints the column-axis measures of a grouped read', async () => {
    renderInStack({
      columns: groupedColumnAxisFixture.columns,
      groupingState: {
        aggregates: groupedColumnAxisFixture.aggregates,
        columnAxis: groupedColumnAxisFixture.columnAxis,
        keys: groupedColumnAxisFixture.groupingKeys,
      },
      rows: groupedColumnAxisFixture.rows,
    });

    const labels = await screen.findAllByTestId('table-header-label');

    expect(labels.map((label) => label.textContent)).toStrictEqual([
      'Customer Type',
      'Pending',
      'Shipped',
    ]);
  });
});

type CaptureProps = {
  readonly values: unknown[];
};

const CaptureContexts = ({ values }: CaptureProps) => {
  values.push(use(GlobalSettingsContext), use(NotificationContext));

  return <span />;
};

describe('Table own stack reuses providers already above it', () => {
  it('mounts no second global-settings or notification provider', () => {
    const outer: unknown[] = [];
    const inner: unknown[] = [];

    render(
      <GlobalSettingsProvider>
        <NotificationProvider>
          <CaptureContexts values={outer} />
          <Table
            columns={[
              { isPrimaryKey: true, key: 'id', label: 'Id' },
              {
                key: 'name',
                label: 'Probe',
                render: () => <CaptureContexts values={inner} />,
              },
            ]}
            features={{ columnMenu: true }}
            layout='static'
            response={ROWS.slice(0, 1)}
          />
        </NotificationProvider>
      </GlobalSettingsProvider>,
    );

    expect(inner[0]).toBe(outer[0]);
    expect(inner[1]).toBe(outer[1]);
  });
});

describe('TablePresentationContext', () => {
  it('names itself for the React tools', () => {
    expect(TablePresentationContext.displayName).toBe(
      'TablePresentationContext',
    );
  });
});

const bodyCellOf = (columnKey: string) =>
  screen
    .getAllByTestId('table-body-cell')
    .find((cell) => cell.dataset.columnKey === columnKey) ?? document.body;

const classSet = (className = '') =>
  new Set(className.split(' ').filter(Boolean));

describe('Table static layout review fixes', () => {
  it('keeps a pinned static header sticky, like its body cells', () => {
    const wide: readonly TableColumn<Score>[] = [
      { isPrimaryKey: true, key: 'id', label: 'Id', width: 2000 },
      { key: 'name', label: 'Name', width: 2000 },
    ];
    const stickyClasses = [
      ...classSet(stylex.props(tableBodyCellStyles.pinnedLeft(0)).className),
    ].filter((name) =>
      classSet(stylex.props(tableHeaderCellStyles.base(60, 60)).className).has(
        name,
      ),
    );

    render(
      <NotificationProvider>
        <TableConfigProvider<Score>
          columnsState={{
            columnPinning: { left: ['id'], right: [] },
            columns: [...wide],
          }}
        >
          <TableFocusProvider>
            <FiltersDataProvider<Score> columns={[...wide]}>
              <TableOwnStackContext value>
                <Table<Score, readonly Score[]>
                  columns={wide}
                  dataSelector={(response) => response}
                  layout='static'
                  response={ROWS}
                />
              </TableOwnStackContext>
            </FiltersDataProvider>
          </TableFocusProvider>
        </TableConfigProvider>
      </NotificationProvider>,
    );

    const header = headerOf('Id');

    expect(stickyClasses.length).toBeGreaterThan(0);
    expect(stickyClasses.every((name) => header.classList.contains(name))).toBe(
      true,
    );
    const headerPin = classSet(
      stylex.props(tableHeaderCellStyles.pinnedLeft(0)).className,
    );
    const bodyPin = classSet(
      stylex.props(tableBodyCellStyles.pinnedLeft(0)).className,
    );
    const bodyCell = bodyCellOf('id');

    expect(
      [...headerPin].every((name) => header.classList.contains(name)),
    ).toBe(true);
    expect(
      [...bodyPin].every((name) => bodyCell.classList.contains(name)),
    ).toBe(true);
  });

  it('resizes a static column from its handle, header and body together', () => {
    render(
      <Table
        columns={COLUMNS}
        features={{ resize: true }}
        layout='static'
        response={ROWS}
      />,
    );

    expect(bodyCellOf('name').getAttribute('style') ?? '').not.toContain(
      '68px',
    );

    fireEvent.keyDown(
      screen.getByRole('separator', { name: 'Resize Name column' }),
      { key: 'ArrowRight' },
    );

    const sizedWidths = {
      maxWidth: undefined,
      minWidth: undefined,
      width: 68,
    };

    expect(headerOf('Name').style.getPropertyValue('--x-width')).toBe('68px');
    expect(
      (bodyCellOf('name') as HTMLElement).style.getPropertyValue('--x-width'),
    ).toBe('68px');
    expect(
      hasStylexStyle({
        element: headerOf('Name'),
        style: tableHeaderCellStyles.staticLayout(sizedWidths),
      }),
    ).toBe(true);
    expect(
      hasStylexStyle({
        element: bodyCellOf('name'),
        style: tableBodyCellStyles.staticLayout(sizedWidths),
      }),
    ).toBe(true);
  });

  it('lets an unsized fill column grow past its starting width, header and body', () => {
    render(
      <Table
        columns={[
          { isPrimaryKey: true, key: 'id', label: 'Id' },
          { key: 'name', label: 'Name', width: 'fill' },
        ]}
        response={ROWS}
      />,
    );

    const baseCapClasses = [
      ...classSet(stylex.props(tableBodyCellStyles.base(60, 60)).className),
    ].filter(
      (name) =>
        !classSet(
          stylex.props(
            tableBodyCellStyles.base(60, 60),
            tableBodyCellStyles.fill,
          ).className,
        ).has(name),
    );

    expect(baseCapClasses.length).toBeGreaterThan(0);
    expect(
      baseCapClasses.some((name) =>
        bodyCellOf('name').classList.contains(name),
      ),
    ).toBe(false);
    expect(
      hasStylexStyle({
        element: bodyCellOf('name'),
        style: tableBodyCellStyles.fill,
      }),
    ).toBe(true);
    expect(
      hasStylexStyle({
        element: headerOf('Name'),
        style: tableHeaderCellStyles.fill,
      }),
    ).toBe(true);
  });

  it('spans a static header band across its columns, sized by the table', () => {
    render(
      <Table
        columns={[
          { isPrimaryKey: true, key: 'id', label: 'Id' },
          { headerGroupLabel: 'Totals', key: 'name', label: 'Name' },
          { headerGroupLabel: 'Totals', key: 'score', label: 'Score' },
        ]}
        layout='static'
        response={[{ id: 1, name: 'Ada', score: 3 }]}
      />,
    );

    const band = screen.getByText('Totals').closest('th');

    expect(band?.getAttribute('colspan')).toBe('2');
    expect(
      hasStylexStyle({
        element: band ?? document.body,
        style: tableHeaderBandStyles.staticLayout,
      }),
    ).toBe(true);
  });

  it('leaves a virtual header band at its summed width, with no colSpan', () => {
    render(
      <Table
        columns={[
          { isPrimaryKey: true, key: 'id', label: 'Id' },
          { headerGroupLabel: 'Totals', key: 'name', label: 'Name' },
          { headerGroupLabel: 'Totals', key: 'score', label: 'Score' },
        ]}
        response={[{ id: 1, name: 'Ada', score: 3 }]}
      />,
    );

    expect(
      screen.getByText('Totals').closest('th')?.hasAttribute('colspan'),
    ).toBe(false);
  });

  it('keeps a static empty state at its content height across renders', () => {
    const element = (
      <Table
        caption='Nothing yet'
        columns={COLUMNS}
        footer='No rows to total'
        layout='static'
        response={[]}
      />
    );
    const view = render(element);
    const viewport = screen.getByTestId('table-empty-state-viewport');
    const firstStyle = viewport.getAttribute('style');

    view.rerender(element);

    expect(firstStyle).toBeNull();
    expect(
      screen.getByTestId('table-empty-state-viewport').getAttribute('style'),
    ).toBeNull();
  });
});

describe('Table footer row in a virtual grid', () => {
  it('counts the footer in aria-rowcount and numbers it after the last body row', () => {
    render(<Table columns={COLUMNS} footer='Two people' response={ROWS} />);

    const footerRow = screen.getByTestId('table-footer').querySelector('tr');

    expect(screen.getByTestId('table').getAttribute('aria-rowcount')).toBe(
      String(ROWS.length + 2),
    );
    expect(footerRow?.getAttribute('aria-rowindex')).toBe(
      String(ROWS.length + 2),
    );
  });

  it('leaves the count at header plus rows with no footer', () => {
    render(<Table columns={COLUMNS} response={ROWS} />);

    expect(screen.getByTestId('table').getAttribute('aria-rowcount')).toBe(
      String(ROWS.length + 1),
    );
  });

  it('numbers the footer after the visible rows of a grouped grid', () => {
    const grouped = [
      {
        tableGroup: {
          aggregates: [],
          count: 1,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'Ada', value: 'Ada' }],
        },
      },
      { id: 1, name: 'Ada' },
    ];

    render(
      <Table
        columns={COLUMNS as readonly TableColumn<Record<string, unknown>>[]}
        footer='One group'
        response={grouped}
      />,
    );

    expect(screen.getByTestId('table').getAttribute('role')).toBe('treegrid');
    expect(
      screen
        .getByTestId('table-footer')
        .querySelector('tr')
        ?.getAttribute('aria-rowindex'),
    ).toBe(String(grouped.length + 2));
    expect(screen.getByTestId('table').getAttribute('aria-rowcount')).toBe(
      String(grouped.length + 2),
    );
  });

  it('numbers the footer after the reported total of a flat grid, not after its loaded rows', () => {
    render(
      <Table<Score, { readonly rows: readonly Score[]; readonly total: number }>
        columns={COLUMNS}
        dataSelector={(page) => page.rows}
        dataTotalSelector={(page) => page.total}
        footer='Two of fifty'
        response={{ rows: ROWS, total: 50 }}
      />,
    );

    expect(
      screen
        .getByTestId('table-footer')
        .querySelector('tr')
        ?.getAttribute('aria-rowindex'),
    ).toBe('52');
  });

  it('numbers the footer after the standing rows of a tree, not after the reported total', () => {
    const grouped: readonly Record<string, unknown>[] = [
      {
        tableGroup: {
          aggregates: [],
          count: 1,
          isSubtotal: false,
          path: [{ columnKey: 'name', label: 'Ada', value: 'Ada' }],
        },
      },
      { id: 1, name: 'Ada' },
    ];

    render(
      <Table<
        Record<string, unknown>,
        {
          readonly rows: readonly Record<string, unknown>[];
          readonly total: number;
        }
      >
        columns={COLUMNS as readonly TableColumn<Record<string, unknown>>[]}
        dataSelector={(page) => page.rows}
        dataTotalSelector={(page) => page.total}
        footer='One group'
        response={{ rows: grouped, total: 50 }}
      />,
    );

    expect(
      screen
        .getByTestId('table-footer')
        .querySelector('tr')
        ?.getAttribute('aria-rowindex'),
    ).toBe(String(grouped.length + 2));
  });
});

type PinnedStackArgs = {
  readonly columnPinning: {
    readonly left: readonly string[];
    readonly right: readonly string[];
  };
};

const PINNABLE: readonly TableColumn<Record<string, unknown>>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'name', label: 'Name' },
  { key: 'team', label: 'Team' },
  { key: 'notes', label: 'Notes' },
];

const renderPinnedStatic = ({ columnPinning }: PinnedStackArgs) =>
  render(
    <NotificationProvider>
      <TableConfigProvider<Record<string, unknown>>
        columnsState={{
          columnPinning: {
            left: [...columnPinning.left],
            right: [...columnPinning.right],
          },
          columns: [...PINNABLE],
        }}
      >
        <TableFocusProvider>
          <FiltersDataProvider<Record<string, unknown>> columns={[...PINNABLE]}>
            <TableOwnStackContext value>
              <Table<
                Record<string, unknown>,
                readonly Record<string, unknown>[]
              >
                columns={PINNABLE}
                dataSelector={(response) => response}
                layout='static'
                response={[{ id: 1, name: 'Ada', notes: 'n', team: 'Blue' }]}
              />
            </TableOwnStackContext>
          </FiltersDataProvider>
        </TableFocusProvider>
      </TableConfigProvider>
    </NotificationProvider>,
  );

const FIXED_START_WIDTHS = {
  maxWidth: DEFAULT_MIN_COLUMN_WIDTH,
  minWidth: DEFAULT_MIN_COLUMN_WIDTH,
  width: DEFAULT_MIN_COLUMN_WIDTH,
};

type InlineVarArgs = {
  readonly element: Element;
  readonly name: string;
};

const inlineVar = ({ element, name }: InlineVarArgs) =>
  (element as HTMLElement).style.getPropertyValue(name);

describe('Table static layout pinned offsets', () => {
  it('fixes unsized left-pinned columns at the width the next offset assumes', () => {
    renderPinnedStatic({ columnPinning: { left: ['id', 'name'], right: [] } });

    const first = bodyCellOf('id');
    const second = bodyCellOf('name');

    expect(inlineVar({ element: first, name: '--x-width' })).toBe(
      `${DEFAULT_MIN_COLUMN_WIDTH}px`,
    );
    expect(
      hasStylexStyle({
        element: first,
        style: tableBodyCellStyles.staticLayout(FIXED_START_WIDTHS),
      }),
    ).toBe(true);
    expect(inlineVar({ element: second, name: '--x-left' })).toBe(
      inlineVar({ element: first, name: '--x-width' }),
    );
    expect(
      hasStylexStyle({
        element: headerOf('Id'),
        style: tableHeaderCellStyles.staticLayout(FIXED_START_WIDTHS),
      }),
    ).toBe(true);
    expect(inlineVar({ element: headerOf('Name'), name: '--x-left' })).toBe(
      `${DEFAULT_MIN_COLUMN_WIDTH}px`,
    );
  });

  it('fixes unsized right-pinned columns the same way', () => {
    renderPinnedStatic({
      columnPinning: { left: [], right: ['team', 'notes'] },
    });

    const outer = bodyCellOf('notes');
    const inner = bodyCellOf('team');

    expect(
      hasStylexStyle({
        element: outer,
        style: tableBodyCellStyles.staticLayout(FIXED_START_WIDTHS),
      }),
    ).toBe(true);
    expect(inlineVar({ element: inner, name: '--x-right' })).toBe(
      inlineVar({ element: outer, name: '--x-width' }),
    );
    expect(inlineVar({ element: headerOf('Team'), name: '--x-right' })).toBe(
      `${DEFAULT_MIN_COLUMN_WIDTH}px`,
    );
  });

  it('leaves an unpinned unsized column sized by its content', () => {
    renderPinnedStatic({ columnPinning: { left: ['id', 'name'], right: [] } });

    expect(
      hasStylexStyle({
        element: bodyCellOf('team'),
        style: tableBodyCellStyles.staticLayout(FIXED_START_WIDTHS),
      }),
    ).toBe(false);
    expect(
      hasStylexStyle({
        element: headerOf('Team'),
        style: tableHeaderCellStyles.staticLayout(FIXED_START_WIDTHS),
      }),
    ).toBe(false);
  });
});

describe('Table element props the grid also uses', () => {
  it('runs a consumer key handler and the grid keyboard together in the virtual layout', () => {
    const onKeyDown = vi.fn();

    render(<Table columns={COLUMNS} onKeyDown={onKeyDown} response={ROWS} />);

    const isDefaultKept = fireEvent.keyDown(screen.getByTestId('table'), {
      key: 'ArrowDown',
    });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(isDefaultKept).toBe(false);
  });

  it('runs consumer focus handlers and the grid roving focus together in the virtual layout', () => {
    const onBlur = vi.fn();
    const onFocus = vi.fn();

    render(
      <Table
        columns={COLUMNS}
        onBlur={onBlur}
        onFocus={onFocus}
        response={ROWS}
      />,
    );

    const table = screen.getByTestId('table');

    expect(table.getAttribute('tabindex')).toBe('0');

    act(() => {
      table.focus();
    });

    expect(onFocus).toHaveBeenCalled();
    expect(table.getAttribute('tabindex')).toBe('-1');

    act(() => {
      (document.activeElement as HTMLElement).blur();
    });

    expect(onBlur).toHaveBeenCalled();
    expect(table.getAttribute('tabindex')).toBe('0');
  });

  it('keeps the grid role, tab stop and row count over the consumer in the virtual layout', () => {
    render(
      <Table
        aria-rowcount={99}
        columns={COLUMNS}
        response={ROWS}
        role='presentation'
        tabIndex={-1}
      />,
    );

    const table = screen.getByTestId('table');

    expect(table.getAttribute('role')).toBe('grid');
    expect(table.getAttribute('tabindex')).toBe('0');
    expect(table.getAttribute('aria-rowcount')).toBe(String(ROWS.length + 1));
  });

  it('passes handlers, tabIndex and aria-rowcount through in the static layout, keeping role table', () => {
    const onKeyDown = vi.fn();

    render(
      <Table
        aria-rowcount={99}
        columns={COLUMNS}
        layout='static'
        onKeyDown={onKeyDown}
        response={ROWS}
        role='presentation'
        tabIndex={0}
      />,
    );

    const table = screen.getByTestId('table');

    fireEvent.keyDown(table, { key: 'ArrowDown' });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(table.getAttribute('tabindex')).toBe('0');
    expect(table.getAttribute('aria-rowcount')).toBe('99');
    expect(table.getAttribute('role')).toBe('table');
  });
});
