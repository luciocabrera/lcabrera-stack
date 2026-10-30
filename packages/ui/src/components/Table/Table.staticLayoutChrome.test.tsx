// @vitest-environment jsdom

import type { StyleXStyles } from '@stylexjs/stylex';

import * as stylex from '@stylexjs/stylex';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { use } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vite-plus/test';

import { GlobalSettingsProvider } from '#ui/contexts/GlobalSettingsContext';
import { GlobalSettingsContext } from '#ui/contexts/GlobalSettingsContext/GlobalSettingsContext.context';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { NotificationContext } from '#ui/contexts/NotificationContext/NotificationContext.context';
import { groupedColumnAxisFixture } from '#ui/utils/tests/groupedColumnAxisFixture.util';

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
import { tableHeaderCellStyles } from './TableHeaderCell/TableHeaderCell.stylex';
import { styles as staticContentStyles } from './TableStaticContent/TableStaticContent.stylex';

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

type HasEveryClassArgs = {
  readonly element: Element;
  readonly style: StyleXStyles;
};

const hasEveryClass = ({ element, style }: HasEveryClassArgs) => {
  const applied = new Set(element.className.split(' ').filter(Boolean));

  return (stylex.props(style).className ?? '')
    .split(' ')
    .filter(Boolean)
    .every((name) => applied.has(name));
};

const ancestorsOf = (element: Element) => {
  const chain: Element[] = [];

  for (
    let node = element.parentElement;
    node !== null && node !== document.body;
    node = node.parentElement
  ) {
    chain.push(node);
  }

  return chain;
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
      hasEveryClass({
        element: wrapper ?? document.body,
        style: staticContentStyles.rounded,
      }),
    ).toBe(false);
  });

  it('wraps a virtual table in the flex wrapper by default, and a static one not', () => {
    render(<Table columns={COLUMNS} response={ROWS} />);

    const wrapped = ancestorsOf(screen.getByTestId('table')).some((element) =>
      hasEveryClass({ element, style: flexWrapperStyles.wrapper }),
    );

    cleanup();
    render(<Table columns={COLUMNS} layout='static' response={ROWS} />);

    const staticWrapped = ancestorsOf(screen.getByTestId('table')).some(
      (element) => hasEveryClass({ element, style: flexWrapperStyles.wrapper }),
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
      hasEveryClass({
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
      hasEveryClass({
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
