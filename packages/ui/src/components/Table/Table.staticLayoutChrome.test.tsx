// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { use } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vite-plus/test';

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

    const wrapped = ancestorsOf(screen.getByTestId('table')).some((element) =>
      hasStylexStyle({ element, style: flexWrapperStyles.wrapper }),
    );

    cleanup();
    render(<Table columns={COLUMNS} layout='static' response={ROWS} />);

    const staticWrapped = ancestorsOf(screen.getByTestId('table')).some(
      (element) =>
        hasStylexStyle({ element, style: flexWrapperStyles.wrapper }),
    );

    expect([wrapped, staticWrapped]).toStrictEqual([true, false]);
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

describe('Table static layout inside a provided stack', () => {
  it('opens no settings drawer the meta state asks for while settings are off', () => {
    renderInStack({
      columns: COLUMNS,
      metaState: { isTableSettingsOpen: true, isTableSettingsPinned: true },
      rows: ROWS,
    });

    expect(screen.queryByRole('radio', { name: 'Spacious' })).toBeNull();
  });

  it('opens no settings drawer in the virtual layout either while settings are off', () => {
    renderInStack({
      columns: COLUMNS,
      features: { settings: false },
      layout: 'virtual',
      metaState: { isTableSettingsOpen: true, isTableSettingsPinned: true },
      rows: ROWS,
    });

    expect(screen.queryByRole('radio', { name: 'Spacious' })).toBeNull();
  });

  it('opens it once settings are on', () => {
    renderInStack({
      columns: COLUMNS,
      features: { settings: true },
      metaState: { isTableSettingsOpen: true, isTableSettingsPinned: true },
      rows: ROWS,
    });

    expect(screen.getByRole('radio', { name: 'Spacious' })).toBeDefined();
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

const bodyCellOf = (columnKey: string) => {
  const cell = screen
    .getByTestId('table-body')
    .querySelector(`td[data-column-key="${CSS.escape(columnKey)}"]`);

  if (cell === null) throw new Error(`no ${columnKey} cell`);

  return cell;
};

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
