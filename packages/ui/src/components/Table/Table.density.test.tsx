// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';

import type { TableColumn, TableDensity, TableMetaState } from './Table.types';

import { FiltersDataProvider } from './contexts/FiltersData';
import { TableConfigProvider } from './contexts/TableConfig';
import { TableOwnStackContext } from './contexts/TableConfig/TableOwnStackContext.context';
import { TableFocusProvider } from './contexts/TableFocus';
import { Table } from './Table.component';

type Reading = {
  readonly id: number;
  readonly value: number;
};

type ReadingPage = {
  readonly rows: readonly Reading[];
};

type RenderSelectedArgs = {
  readonly density?: TableDensity;
  readonly headerDensity?: TableDensity;
  readonly metaState: Partial<TableMetaState>;
};

const COLUMNS: readonly TableColumn<Reading>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { dataType: 'number', key: 'value', label: 'Value' },
];

const ROWS: readonly Reading[] = Array.from({ length: 200 }, (_unused, id) => ({
  id,
  value: id * 10,
}));

const LEVELS = [
  {
    bodyFont: typography.fontSizeXs,
    density: 'dense',
    headerBandFont: typography.fontSizeXs,
    headerFont: typography.fontSizeXs,
    padding: spacing.xxs,
    rowHeight: 24,
  },
  {
    bodyFont: typography.fontSizeSm,
    density: 'compact',
    headerBandFont: typography.fontSizeXs,
    headerFont: typography.fontSizeSm,
    padding: spacing.xs,
    rowHeight: 32,
  },
  {
    bodyFont: typography.fontSizeSm,
    density: 'comfortable',
    headerBandFont: typography.fontSizeXs,
    headerFont: typography.fontSizeSm,
    padding: spacing.sm,
    rowHeight: 40,
  },
  {
    bodyFont: typography.fontSizeMd,
    density: 'spacious',
    headerBandFont: typography.fontSizeXs,
    headerFont: typography.fontSizeSm,
    padding: spacing.md,
    rowHeight: 48,
  },
] as const;

afterEach(cleanup);

const readTableVariable = (name: string) =>
  screen
    .getByTestId('table')
    .style.getPropertyValue(`--x---table-${name}`)
    .trim();

const bodyRows = () =>
  screen.getAllByRole('row').filter((row) => row.closest('tbody') !== null);

const headerRow = () => {
  const row = screen
    .getAllByRole('row')
    .find((candidate) => candidate.closest('thead') !== null);

  if (row === undefined) throw new Error('no header row rendered');

  return row;
};

const firstBodyRow = () => {
  const [row] = bodyRows();

  if (row === undefined) throw new Error('no body row rendered');

  return row;
};

const rowHeightOf = (row: HTMLElement) =>
  row.style.getPropertyValue('--x-height');

const readDensityMarkup = (root: ParentNode) => ({
  rows: [...root.querySelectorAll('tr')]
    .slice(0, 3)
    .map((row) => row.style.cssText),
  table: root.querySelector('table')?.style.cssText,
});

const expectCompactLook = () => {
  expect(rowHeightOf(firstBodyRow())).toBe('32px');
  expect(readTableVariable('body-font-size')).toBe(typography.fontSizeSm);
  expect(readTableVariable('header-font-size')).toBe(typography.fontSizeSm);
};

const renderSelected = ({
  density,
  headerDensity,
  metaState,
}: RenderSelectedArgs) =>
  render(
    <TableConfigProvider<Reading>
      columnsState={{ columns: [...COLUMNS] }}
      metaState={metaState}
    >
      <TableFocusProvider>
        <FiltersDataProvider<Reading> columns={[...COLUMNS]}>
          <TableOwnStackContext value>
            <Table<Reading, ReadingPage>
              columns={COLUMNS}
              dataSelector={(page) => page.rows}
              density={density}
              headerDensity={headerDensity}
              response={{ rows: ROWS }}
            />
          </TableOwnStackContext>
        </FiltersDataProvider>
      </TableFocusProvider>
    </TableConfigProvider>,
  );

describe('Table density', () => {
  it.each(LEVELS)(
    'renders $density at $rowHeight px with its own font and padding',
    ({ bodyFont, density, headerBandFont, headerFont, padding, rowHeight }) => {
      render(<Table columns={COLUMNS} density={density} response={ROWS} />);

      expect(rowHeightOf(firstBodyRow())).toBe(`${rowHeight}px`);
      expect(rowHeightOf(headerRow())).toBe(`${rowHeight}px`);
      expect(readTableVariable('body-font-size')).toBe(bodyFont);
      expect(readTableVariable('body-padding-inline')).toBe(padding);
      expect(readTableVariable('header-font-size')).toBe(headerFont);
      expect(readTableVariable('header-band-font-size')).toBe(headerBandFont);
      expect(readTableVariable('header-padding-inline')).toBe(padding);
    },
  );

  it('defaults to compact: a 32px row, a fontSizeSm body and header, and spacing.xs padding', () => {
    render(<Table columns={COLUMNS} response={ROWS} />);

    expectCompactLook();
    expect(readTableVariable('body-padding-inline')).toBe(spacing.xs);
  });

  it('gives the header row its own level when headerDensity differs', () => {
    render(
      <Table
        columns={COLUMNS}
        density='spacious'
        headerDensity='dense'
        response={ROWS}
      />,
    );

    expect(rowHeightOf(firstBodyRow())).toBe('48px');
    expect(rowHeightOf(headerRow())).toBe('24px');
    expect(readTableVariable('body-font-size')).toBe(typography.fontSizeMd);
    expect(readTableVariable('body-padding-inline')).toBe(spacing.md);
    expect(readTableVariable('header-font-size')).toBe(typography.fontSizeXs);
    expect(readTableVariable('header-padding-inline')).toBe(spacing.xxs);
  });

  it('renders more virtualized rows in the same viewport at dense than at spacious', () => {
    render(<Table columns={COLUMNS} density='dense' response={ROWS} />);
    const denseCount = bodyRows().length;
    cleanup();

    render(<Table columns={COLUMNS} density='spacious' response={ROWS} />);
    const spaciousCount = bodyRows().length;

    expect(denseCount).toBeLessThan(ROWS.length);
    expect(spaciousCount).toBeGreaterThan(0);
    expect(denseCount).toBeGreaterThan(spaciousCount);
  });

  it('renders the density on the server exactly as on the client', () => {
    const element = (
      <Table
        columns={COLUMNS}
        density='dense'
        headerDensity='spacious'
        response={ROWS}
      />
    );
    const serverTree = document.createElement('div');
    serverTree.innerHTML = renderToString(element);

    const { container } = render(element);

    expect(readDensityMarkup(serverTree).table).toContain('--x---table-');
    expect(readDensityMarkup(container)).toStrictEqual(
      readDensityMarkup(serverTree),
    );
  });
});

describe('Table density from a saved meta state', () => {
  it('renders a saved compact table at the 32px row and fontSizeSm body it always had', () => {
    renderSelected({ metaState: { density: 'compact' } });

    expectCompactLook();
  });

  it('loads a saved comfortable table unchanged and renders the 40px level', () => {
    renderSelected({ metaState: { density: 'comfortable' } });

    expect(rowHeightOf(firstBodyRow())).toBe('40px');
    expect(readTableVariable('body-font-size')).toBe(typography.fontSizeSm);
    expect(readTableVariable('body-padding-inline')).toBe(spacing.sm);
  });

  it('takes the density props on a selected source when the meta state holds none', () => {
    renderSelected({
      density: 'dense',
      headerDensity: 'comfortable',
      metaState: {},
    });

    expect(rowHeightOf(firstBodyRow())).toBe('24px');
    expect(rowHeightOf(headerRow())).toBe('40px');
  });

  it('keeps the saved level over the density prop', () => {
    renderSelected({ density: 'dense', metaState: { density: 'spacious' } });

    expect(rowHeightOf(firstBodyRow())).toBe('48px');
    expect(rowHeightOf(headerRow())).toBe('48px');
  });

  it('lets an explicit rowHeight win over the density', () => {
    renderSelected({ metaState: { density: 'dense', rowHeight: 36 } });

    expect(rowHeightOf(firstBodyRow())).toBe('36px');
    expect(readTableVariable('body-font-size')).toBe(typography.fontSizeXs);
  });

  it('lets headerDensity set the header height even when rowHeight is set', () => {
    renderSelected({
      headerDensity: 'spacious',
      metaState: { density: 'dense', rowHeight: 36 },
    });

    expect(rowHeightOf(firstBodyRow())).toBe('36px');
    expect(rowHeightOf(headerRow())).toBe('48px');
  });

  it('keeps the header on rowHeight when nothing names a header level', () => {
    renderSelected({ metaState: { density: 'dense', rowHeight: 36 } });

    expect(rowHeightOf(headerRow())).toBe('36px');
  });
});
