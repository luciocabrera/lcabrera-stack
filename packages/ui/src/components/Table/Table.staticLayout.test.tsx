// @vitest-environment jsdom

import type { StyleXStyles } from '@stylexjs/stylex';

import * as stylex from '@stylexjs/stylex';
import { cleanup, render, screen, within } from '@testing-library/react';
import { createRef, use } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it } from 'vite-plus/test';

import { GlobalSettingsContext } from '#ui/contexts/GlobalSettingsContext/GlobalSettingsContext.context';
import { NotificationContext } from '#ui/contexts/NotificationContext/NotificationContext.context';

import type {
  TableColumn,
  TableFeatures,
  TableLayoutMode,
} from './Table.types';

import { FiltersDataContext } from './contexts/FiltersData/FiltersDataContext.context';
import { Table } from './Table.component';
import { TABLE_GROUP_ROW_FIELD } from './Table.constants';
import { tableBodyCellStyles } from './TableBodyCell/TableBodyCell.stylex';
import { styles as virtualContentStyles } from './TableContent/TableContent.stylex';
import { tableHeaderCellStyles } from './TableHeaderCell/TableHeaderCell.stylex';
import { tableRowStyles } from './TableRow/TableRow.stylex';

type Score = {
  readonly id: number;
  readonly name: string;
  readonly score: number;
};

const ROWS: readonly Score[] = Array.from({ length: 60 }, (_unused, id) => ({
  id,
  name: `Entry ${id}`,
  score: id * 3,
}));

const COLUMNS: readonly TableColumn<Score>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { dataType: 'string', key: 'name', label: 'Name' },
  { dataType: 'number', key: 'score', label: 'Score' },
];

beforeAll(() => {
  Object.assign(HTMLElement.prototype, {
    hidePopover: () => {},
    scrollTo: () => {},
    showPopover: () => {},
  });
});

afterEach(cleanup);

const classesOf = (element: Element) =>
  new Set(element.className.split(' ').filter(Boolean));

const classesOfStyle = (style: StyleXStyles) =>
  (stylex.props(style).className ?? '').split(' ').filter(Boolean);

type HasEveryClassArgs = {
  readonly element: Element;
  readonly style: StyleXStyles;
};

const hasEveryClass = ({ element, style }: HasEveryClassArgs) => {
  const applied = classesOf(element);

  return classesOfStyle(style).every((name) => applied.has(name));
};

const bodyRows = () =>
  [...screen.getByTestId('table-body').querySelectorAll('tr')].filter(
    (row) => row.getAttribute('aria-hidden') !== 'true',
  );

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

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]';

const tabSequence = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (element) => element.tabIndex >= 0,
  );

const cellOf = (columnKey: string) => {
  const cell = screen
    .getByTestId('table-body')
    .querySelector(`td[data-column-key="${CSS.escape(columnKey)}"]`);

  if (cell === null) throw new Error(`no ${columnKey} cell`);

  return cell;
};

const headerOf = (label: string) => {
  const header = screen.getByText(label).closest('th');

  if (header === null) throw new Error(`no ${label} header`);

  return header;
};

const ProviderProbe = () => (
  <span data-testid='provider-probe'>
    {[
      Object.hasOwn(use(FiltersDataContext), 'filtersDataStore')
        ? 'filters'
        : '',
      use(GlobalSettingsContext) === undefined ? '' : 'settings',
      use(NotificationContext) === undefined ? '' : 'notifications',
    ]
      .filter(Boolean)
      .join(' ')}
  </span>
);

type GroupRowArgs = {
  readonly count: number;
  readonly label: string;
};

const groupRow = ({ count, label }: GroupRowArgs) => ({
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [],
    count,
    isSubtotal: false,
    path: [{ columnKey: 'name', label, value: label }],
  },
});

type RenderScoresArgs = {
  readonly layout?: TableLayoutMode;
};

const renderScores = ({ layout = 'static' }: RenderScoresArgs = {}) =>
  render(
    <section>
      <Table
        caption='Scores this week'
        columns={COLUMNS}
        layout={layout}
        response={ROWS}
      />
    </section>,
  );

describe('Table static layout', () => {
  it('renders every row, as a table, under its caption, inside a parent with no height', () => {
    renderScores();

    const table = screen.getByTestId('table');

    expect(bodyRows()).toHaveLength(ROWS.length);
    expect(table.getAttribute('role')).toBe('table');
    expect(table.querySelector('caption')?.textContent).toBe(
      'Scores this week',
    );
    expect(table.hasAttribute('aria-rowcount')).toBe(false);
  });

  it('virtualizes the same rows in the virtual layout, so the row count discriminates', () => {
    renderScores({ layout: 'virtual' });

    expect(bodyRows().length).toBeLessThan(ROWS.length);
    expect(screen.getByTestId('table').getAttribute('role')).toBe('grid');
  });

  it('takes its height from its rows: no ancestor is a size container or a 100% height', () => {
    renderScores();

    const chain = ancestorsOf(screen.getByTestId('table'));

    for (const element of chain) {
      expect(
        hasEveryClass({ element, style: virtualContentStyles.wrapper }),
      ).toBe(false);
      expect(
        hasEveryClass({ element, style: virtualContentStyles.outerContainer }),
      ).toBe(false);
    }

    for (const row of bodyRows()) {
      expect(
        hasEveryClass({ element: row, style: tableRowStyles.staticLayout(32) }),
      ).toBe(true);
      expect(row.style.getPropertyValue('--x-height')).toBe('32px');
    }
  });

  it('carries the size-container wrapper in the virtual layout, which the static one drops', () => {
    renderScores({ layout: 'virtual' });

    const chain = ancestorsOf(screen.getByTestId('table'));

    expect(
      chain.some((element) =>
        hasEveryClass({ element, style: virtualContentStyles.wrapper }),
      ),
    ).toBe(true);
  });

  it('renders no settings button, column menu or resize handle by default', () => {
    renderScores();

    expect(screen.queryByRole('button', { name: 'Table settings' })).toBeNull();
    expect(screen.queryByRole('button', { name: /column actions/ })).toBeNull();
    expect(screen.queryByRole('separator')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('renders each piece of chrome a feature switch turns back on', () => {
    render(
      <Table
        columns={COLUMNS}
        features={{
          columnMenu: true,
          resize: true,
          settings: true,
          toolbar: true,
        }}
        layout='static'
        response={ROWS}
        title='Scores'
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Table settings' }),
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Name column actions' }),
    ).toBeDefined();
    expect(
      screen.getByRole('separator', { name: 'Resize Name column' }),
    ).toBeDefined();
  });

  it('turns chrome off in the virtual layout too, one switch at a time', () => {
    render(
      <Table
        columns={COLUMNS}
        features={{ columnMenu: false, resize: false, settings: false }}
        response={ROWS}
        title='Scores'
      />,
    );

    expect(screen.getByText('Scores')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Table settings' })).toBeNull();
    expect(screen.queryByRole('button', { name: /column actions/ })).toBeNull();
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('drops the title bar when the toolbar is off', () => {
    render(
      <Table
        columns={COLUMNS}
        features={{ toolbar: false }}
        response={ROWS}
        title='Scores'
      />,
    );

    expect(screen.queryByText('Scores')).toBeNull();
    expect(screen.getByTestId('table').getAttribute('role')).toBe('grid');
  });
});

describe('Table static layout keyboard order', () => {
  const LINKED_COLUMNS: readonly TableColumn<Score>[] = [
    ...COLUMNS,
    {
      key: 'name',
      label: 'Profile',
      render: (row) => <a href={`/entries/${row.id}`}>{row.name}</a>,
    },
  ];
  const FEW_ROWS = ROWS.slice(0, 3);

  it('makes the first link the first Tab stop, with no roving tab stop before it', () => {
    render(
      <Table columns={LINKED_COLUMNS} layout='static' response={FEW_ROWS} />,
    );

    const [first, ...others] = tabSequence(document.body);

    expect(first?.tagName).toBe('A');
    expect(first?.getAttribute('href')).toBe('/entries/0');
    expect(others.map((element) => element.tagName)).toStrictEqual(['A', 'A']);
    expect(screen.getByTestId('table').hasAttribute('tabindex')).toBe(false);

    for (const cell of screen
      .getByTestId('table-body')
      .querySelectorAll('td')) {
      expect(cell.hasAttribute('tabindex')).toBe(false);
      expect(cell.hasAttribute('role')).toBe(false);
    }
  });

  it('puts the grid itself ahead of the link in the virtual layout', () => {
    render(<Table columns={LINKED_COLUMNS} response={FEW_ROWS} />);

    const table = screen.getByTestId('table');
    const tableStops = tabSequence(table.parentElement ?? document.body);

    expect(tableStops[0]).toBe(table);
  });
});

describe('Table element props', () => {
  it.each(['static', 'virtual'] as const)(
    'passes customStylex, a ref and the <table> props to the rendered table in the %s layout',
    (layout) => {
      const ref = createRef<HTMLTableElement>();

      render(
        <Table
          aria-label='Weekly scores'
          columns={COLUMNS}
          customStylex={tableBodyCellStyles.alignCenter}
          data-origin='scores'
          id='weekly-scores'
          layout={layout}
          ref={ref}
          response={ROWS.slice(0, 2)}
        />,
      );

      const table = screen.getByTestId('table');

      expect(table.getAttribute('aria-label')).toBe('Weekly scores');
      expect(table.dataset.origin).toBe('scores');
      expect(table.id).toBe('weekly-scores');
      expect(ref.current).toBe(table);
      expect(
        hasEveryClass({
          element: table,
          style: tableBodyCellStyles.alignCenter,
        }),
      ).toBe(true);
    },
  );

  it('keeps the Table props off the element', () => {
    render(
      <Table
        columns={COLUMNS}
        layout='static'
        response={ROWS.slice(0, 2)}
        title='Scores'
      />,
    );

    const table = screen.getByTestId('table');

    expect(table.hasAttribute('title')).toBe(false);
    expect(table.hasAttribute('response')).toBe(false);
    expect(table.hasAttribute('layout')).toBe(false);
    expect(table.hasAttribute('columns')).toBe(false);
  });
});

describe('Table caption and footer', () => {
  it.each(['static', 'virtual'] as const)(
    'renders the footer as one <tfoot> row spanning every column in the %s layout',
    (layout) => {
      render(
        <Table
          columns={COLUMNS}
          footer='Three entries shown'
          layout={layout}
          response={ROWS.slice(0, 3)}
        />,
      );

      const footer = screen.getByTestId('table-footer');
      const cell = within(footer).getByText('Three entries shown');

      expect(footer.tagName).toBe('TFOOT');
      expect(cell.getAttribute('colspan')).toBe(String(COLUMNS.length));
    },
  );

  it('renders neither a caption nor a footer when none is given', () => {
    renderScores({ layout: 'virtual' });
    cleanup();
    render(<Table columns={COLUMNS} layout='static' response={ROWS} />);

    const table = screen.getByTestId('table');

    expect(table.querySelector('caption')).toBeNull();
    expect(table.querySelector('tfoot')).toBeNull();
  });
});

describe('Table column alignment', () => {
  const ALIGNED: readonly TableColumn<Score>[] = [
    { isPrimaryKey: true, key: 'id', label: 'Id' },
    { align: 'end', dataType: 'string', key: 'name', label: 'Name' },
    { align: 'start', dataType: 'number', key: 'score', label: 'Score' },
  ];

  it.each(['static', 'virtual'] as const)(
    'aligns as the column says, over its dataType, in the %s layout',
    (layout) => {
      render(
        <Table columns={ALIGNED} layout={layout} response={ROWS.slice(0, 1)} />,
      );

      expect(
        hasEveryClass({
          element: cellOf('name'),
          style: tableBodyCellStyles.alignRight,
        }),
      ).toBe(true);
      expect(
        hasEveryClass({
          element: cellOf('score'),
          style: tableBodyCellStyles.alignStart,
        }),
      ).toBe(true);
      expect(
        hasEveryClass({
          element: cellOf('score'),
          style: tableBodyCellStyles.alignRight,
        }),
      ).toBe(false);
      expect(
        hasEveryClass({
          element: headerOf('Name'),
          style: tableHeaderCellStyles.alignEnd,
        }),
      ).toBe(true);
    },
  );

  it('aligns as the dataType gives when the column sets nothing', () => {
    render(
      <Table columns={COLUMNS} layout='static' response={ROWS.slice(0, 1)} />,
    );

    expect(
      hasEveryClass({
        element: cellOf('score'),
        style: tableBodyCellStyles.alignRight,
      }),
    ).toBe(true);
    expect(
      hasEveryClass({
        element: cellOf('name'),
        style: tableBodyCellStyles.alignRight,
      }),
    ).toBe(false);
    expect(
      hasEveryClass({
        element: headerOf('Score'),
        style: tableHeaderCellStyles.alignEnd,
      }),
    ).toBe(false);
  });

  it('keeps an explicit alignment on a render cell, which dataType alone cannot', () => {
    render(
      <Table
        columns={[
          { isPrimaryKey: true, key: 'id', label: 'Id' },
          {
            align: 'center',
            key: 'name',
            label: 'Name',
            render: (row) => <strong>{row.name}</strong>,
          },
        ]}
        layout='static'
        response={ROWS.slice(0, 1)}
      />,
    );

    expect(
      hasEveryClass({
        element: cellOf('name'),
        style: tableBodyCellStyles.alignCenter,
      }),
    ).toBe(true);
  });
});

describe('Table providers', () => {
  const PROBED: readonly TableColumn<Score>[] = [
    { isPrimaryKey: true, key: 'id', label: 'Id' },
    { key: 'name', label: 'Probe', render: () => <ProviderProbe /> },
  ];

  type ProbeArgs = {
    readonly features?: TableFeatures;
    readonly layout: TableLayoutMode;
  };

  const probe = ({ features, layout }: ProbeArgs) => {
    render(
      <Table
        columns={PROBED}
        features={features}
        layout={layout}
        response={ROWS.slice(0, 1)}
      />,
    );

    return screen.getByTestId('provider-probe').textContent;
  };

  it('mounts no filter, global settings or notification provider for a static table with no chrome', () => {
    expect(probe({ layout: 'static' })).toBe('');
  });

  it('mounts all three once any piece of chrome is on', () => {
    expect(probe({ features: { columnMenu: true }, layout: 'static' })).toBe(
      'filters settings notifications',
    );
  });

  it('mounts all three for the virtual layout, as before', () => {
    expect(probe({ layout: 'virtual' })).toBe('filters settings notifications');
  });
});

describe('Table static layout over grouped rows', () => {
  const GROUPED = [
    groupRow({ count: 2, label: 'North' }),
    { id: 1, name: 'North', score: 4 },
    { id: 2, name: 'North', score: 5 },
    groupRow({ count: 1, label: 'South' }),
    { id: 3, name: 'South', score: 6 },
  ];

  const GROUPED_COLUMNS: readonly TableColumn<Record<string, unknown>>[] = [
    { isPrimaryKey: true, key: 'id', label: 'Id' },
    { dataType: 'string', key: 'name', label: 'Name' },
    { dataType: 'number', key: 'score', label: 'Score' },
  ];

  it('renders a tree of groups as role="table", every row standing, with no roving focus', () => {
    render(
      <Table columns={GROUPED_COLUMNS} layout='static' response={GROUPED} />,
    );

    const table = screen.getByTestId('table');

    expect(table.getAttribute('role')).toBe('table');
    expect(bodyRows()).toHaveLength(GROUPED.length);
    expect(tabSequence(table)).toStrictEqual([]);
    expect(screen.queryByTestId('table-group-disclosure')).toBeNull();

    for (const row of bodyRows()) {
      expect(row.hasAttribute('aria-level')).toBe(false);
      expect(row.hasAttribute('aria-expanded')).toBe(false);
    }
  });

  it('renders the same rows as a treegrid in the virtual layout', () => {
    render(<Table columns={GROUPED_COLUMNS} response={GROUPED} />);

    expect(screen.getByTestId('table').getAttribute('role')).toBe('treegrid');
  });
});

describe('Table static layout on the server', () => {
  it('renders the same rows, role and caption on the server as on the client', () => {
    const element = (
      <Table
        caption='Scores this week'
        columns={COLUMNS}
        layout='static'
        response={ROWS.slice(0, 5)}
      />
    );
    const serverTree = document.createElement('div');

    serverTree.innerHTML = renderToString(element);

    for (const styled of serverTree.querySelectorAll<HTMLElement>('[style]')) {
      styled.setAttribute('style', styled.style.cssText);
    }

    const { container } = render(element);

    expect(serverTree.querySelector('table')?.getAttribute('role')).toBe(
      'table',
    );
    expect(serverTree.querySelectorAll(':scope tbody tr')).toHaveLength(5);
    expect(container.isEqualNode(serverTree)).toBe(true);
  });
});
