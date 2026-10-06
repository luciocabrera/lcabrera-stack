// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { act, cleanup, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type {
  StandardSchemaV1,
  TableCellPalette,
  TableCellRenderer,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { AppProviders } from '#ui/components/AppProviders';
import {
  TABLE_CELL_BUILT_IN_TONES,
  TABLE_CELL_NEUTRAL_TONE,
} from '#ui/components/Table/cellRenderers/cellRenderers.constants';
import { createEmptyColumnsState } from '#ui/components/Table/utils/createEmptyColumnsState.util';
import { logger } from '#ui/utils/logger';

import { TableLayout } from './TableLayout';

type Page = { readonly data: readonly Row[] };

type RenderGridArgs = {
  readonly cellPalette?: TableCellPalette;
  readonly cellRenderers?: readonly TableCellRenderer[];
  readonly columns?: TableColumn<Row>[];
  readonly isDarkMode?: boolean;
  readonly loaderPalette?: TableCellPalette;
};

type Row = {
  readonly change: number;
  readonly id: number;
  readonly name: string;
  readonly overall: number;
  readonly score: number;
};

const ROWS: readonly Row[] = [
  { change: -0.2, id: 1, name: 'epic', overall: 3.84, score: 4 },
  { change: 0, id: 2, name: 'store-pattern', overall: 3.2, score: 3 },
  { change: 0.31, id: 3, name: 'typescript-api', overall: 2.4, score: 2 },
  { change: 0.04, id: 4, name: 'linter-checker', overall: 1.9, score: 1 },
];

const SCORE_RULES = [
  { gte: 4, tone: 'success' },
  { gte: 3, tone: 'warning' },
  { gte: 2, tone: 'caution' },
  { gte: 0, tone: 'error' },
];

const CAUTION_LOADER: TableCellPalette = {
  caution: {
    dark: { background: 'oklch(0.55 0.14 55)', text: 'oklch(0.97 0.01 55)' },
    light: { background: 'oklch(0.75 0.15 55)', text: 'oklch(0.25 0.05 55)' },
  },
};

const CAUTION_CLIENT: TableCellPalette = {
  caution: {
    dark: { background: 'rgb(90 30 0)', text: 'rgb(255 255 255)' },
    light: { background: 'rgb(255 200 0)', text: 'rgb(20 20 20)' },
  },
};

const COLUMNS: TableColumn<Row>[] = [
  { dataType: 'number', isPrimaryKey: true, key: 'id', label: 'ID' },
  {
    cell: { kind: 'text', params: { monospace: true } },
    dataType: 'string',
    key: 'name',
    label: 'Skill',
  },
  {
    cell: { kind: 'badge', params: { rules: SCORE_RULES } },
    dataType: 'number',
    key: 'score',
    label: 'Clarity',
  },
  {
    cell: { kind: 'text', params: { weight: 'bold' } },
    dataType: 'number',
    format: { number: { maximumFractionDigits: 1, minimumFractionDigits: 1 } },
    key: 'overall',
    label: 'Overall',
  },
  {
    cell: {
      kind: 'delta',
      params: {
        decrease: 'error',
        increase: 'success',
        precision: 1,
        unchanged: 'neutral',
      },
    },
    dataType: 'number',
    key: 'change',
    label: 'Change',
  },
];

const withColumn = (column: TableColumn<Row>) =>
  COLUMNS.map((existing) => (existing.key === column.key ? column : existing));

const renderGrid = async ({
  cellPalette,
  cellRenderers,
  columns = COLUMNS,
  isDarkMode = false,
  loaderPalette = CAUTION_LOADER,
}: RenderGridArgs = {}) => {
  const dataPromise = Promise.resolve<Page>({ data: ROWS });
  const element: ReactNode = (
    <AppProviders defaultTheme={isDarkMode ? 'dark' : 'light'}>
      <TableLayout<Row, Page>
        cellPalette={cellPalette}
        cellRenderers={cellRenderers}
        columnsState={{
          ...createEmptyColumnsState({ columns }),
          cellPalette: loaderPalette,
        }}
        dataPromise={dataPromise}
        dataSelector={(response) => response.data}
        metaState={{
          persistenceKey: 'skills',
          title: { plural: 'Skills', singular: 'Skill' },
        }}
      />
    </AppProviders>
  );
  const router = createMemoryRouter(
    [
      { element, path: '/' },
      { action: async () => ({ ok: true }), path: '/_action/persist-cookie' },
    ],
    { initialEntries: ['/'] },
  );

  await act(async () => {
    render(<RouterProvider router={router} />);
    await dataPromise;
  });
};

type CellAt = { readonly columnKey: string; readonly rowIndex: number };

const cellOf = ({ columnKey, rowIndex }: CellAt) => {
  const cell = screen
    .getAllByRole('gridcell')
    .filter((node) => node.dataset.columnKey === columnKey)[rowIndex];

  if (cell === undefined) throw new Error(`no ${columnKey} cell ${rowIndex}`);

  return cell;
};

const badgeOf = (at: CellAt) =>
  within(cellOf(at)).getByTestId('table-cell-badge');

const styleOf = (element: HTMLElement) => element.getAttribute('style') ?? '';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Table cell renderers', () => {
  it('draws a badge with its value as text, so colour is never the only signal', async () => {
    await renderGrid();

    expect(badgeOf({ columnKey: 'score', rowIndex: 0 }).textContent).toBe('4');
    expect(badgeOf({ columnKey: 'score', rowIndex: 3 }).textContent).toBe('1');
  });

  it('colours a badge by the first matching rule', async () => {
    await renderGrid();

    expect(styleOf(badgeOf({ columnKey: 'score', rowIndex: 0 }))).toContain(
      TABLE_CELL_BUILT_IN_TONES.success?.background,
    );
    expect(styleOf(badgeOf({ columnKey: 'score', rowIndex: 1 }))).toContain(
      TABLE_CELL_BUILT_IN_TONES.warning?.background,
    );
    expect(styleOf(badgeOf({ columnKey: 'score', rowIndex: 3 }))).toContain(
      TABLE_CELL_BUILT_IN_TONES.error?.background,
    );
  });

  it('renders a tone only the loader palette defines with its colours', async () => {
    await renderGrid();

    const style = styleOf(badgeOf({ columnKey: 'score', rowIndex: 2 }));

    expect(style).toContain('oklch(0.75 0.15 55)');
    expect(style).toContain('oklch(0.25 0.05 55)');
  });

  it('lets a client palette entry of the same name win', async () => {
    await renderGrid({ cellPalette: CAUTION_CLIENT });

    const style = styleOf(badgeOf({ columnKey: 'score', rowIndex: 2 }));

    expect(style).toContain('rgb(255 200 0)');
    expect(style).not.toContain('oklch(0.75 0.15 55)');
  });

  it('uses the dark pair of a palette tone under the dark theme', async () => {
    await renderGrid({ isDarkMode: true });

    const style = styleOf(badgeOf({ columnKey: 'score', rowIndex: 2 }));

    expect(style).toContain('oklch(0.55 0.14 55)');
    expect(style).toContain('oklch(0.97 0.01 55)');
    expect(style).not.toContain('oklch(0.75 0.15 55)');
  });

  it('renders a tone no layer defines as neutral', async () => {
    await renderGrid({ loaderPalette: {} });

    expect(styleOf(badgeOf({ columnKey: 'score', rowIndex: 2 }))).toContain(
      TABLE_CELL_NEUTRAL_TONE.background,
    );
  });

  it('counts a palette entry with an invalid colour as an unknown tone', async () => {
    await renderGrid({
      loaderPalette: {
        caution: {
          dark: { background: 'not-a-colour(1)', text: '#fff' },
          light: { background: 'definitelynotacolour', text: '#000' },
        },
      },
    });

    const style = styleOf(badgeOf({ columnKey: 'score', rowIndex: 2 }));

    expect(style).toContain(TABLE_CELL_NEUTRAL_TONE.background);
    expect(style).not.toContain('definitelynotacolour');
  });

  it('draws each delta direction with its glyph and absolute value', async () => {
    await renderGrid();

    expect(cellOf({ columnKey: 'change', rowIndex: 0 }).textContent).toBe(
      '▼ 0.2',
    );
    expect(cellOf({ columnKey: 'change', rowIndex: 1 }).textContent).toBe(
      '±0.0',
    );
    expect(cellOf({ columnKey: 'change', rowIndex: 2 }).textContent).toBe(
      '▲ 0.3',
    );
    expect(cellOf({ columnKey: 'change', rowIndex: 3 }).textContent).toBe(
      '±0.0',
    );
    expect(styleOf(badgeOf({ columnKey: 'change', rowIndex: 0 }))).toContain(
      TABLE_CELL_BUILT_IN_TONES.error?.background,
    );
    expect(styleOf(badgeOf({ columnKey: 'change', rowIndex: 2 }))).toContain(
      TABLE_CELL_BUILT_IN_TONES.success?.background,
    );
  });

  it('draws text over the dataType formatting', async () => {
    await renderGrid();

    expect(cellOf({ columnKey: 'overall', rowIndex: 0 }).textContent).toBe(
      '3.8',
    );
    expect(cellOf({ columnKey: 'name', rowIndex: 0 }).textContent).toBe('epic');
  });

  it.each([
    { call: { kind: 'gauge', params: {} }, case: 'an unregistered kind' },
    {
      call: { kind: 'badge', params: { rules: [{ gt: 3, tone: 'success' }] } },
      case: 'params that fail validation',
    },
  ])(
    'renders the dataType default for $case, without throwing, and warns once',
    async ({ call }) => {
      const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

      await renderGrid({
        columns: withColumn({
          cell: call,
          dataType: 'number',
          key: 'score',
          label: 'Clarity',
        }),
      });

      const cell = cellOf({ columnKey: 'score', rowIndex: 0 });

      expect(cell.textContent).toBe('4');
      expect(within(cell).queryByTestId('table-cell-badge')).toBeNull();
      expect(
        warn.mock.calls.filter(([message]) =>
          String(message).includes(`column "score": cell kind "${call.kind}"`),
        ),
      ).toHaveLength(1);
    },
  );

  it('renders the dataType default for a validator that rejects asynchronously, leaving no unhandled rejection', async () => {
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    const rejecting: TableCellRenderer = {
      kind: 'badge',
      params: {
        '~standard': {
          validate: async () => {
            throw new Error('async boom');
          },
          vendor: 'test',
          version: 1,
        },
      },
      render: () => <span data-testid='never-drawn' />,
    };

    await renderGrid({ cellRenderers: [rejecting] });
    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off('unhandledRejection', unhandled);

    const cell = cellOf({ columnKey: 'score', rowIndex: 0 });

    expect(cell.textContent).toBe('4');
    expect(screen.queryByTestId('never-drawn')).toBeNull();
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('draws the formatted dataType default when a renderer returns undefined', async () => {
    const deferring: TableCellRenderer = {
      kind: 'defer',
      params: {
        '~standard': {
          validate: () => ({ value: {} }),
          vendor: 'test',
          version: 1,
        },
      },
      render: () => undefined,
    };

    await renderGrid({
      cellRenderers: [deferring],
      columns: withColumn({
        cell: { kind: 'defer' },
        dataType: 'number',
        format: { number: { minimumFractionDigits: 2 } },
        key: 'score',
        label: 'Clarity',
      }),
    });

    expect(cellOf({ columnKey: 'score', rowIndex: 0 }).textContent).toBe(
      '4.00',
    );
  });

  it.each([
    { call: { kind: 'badge' }, tone: 'neutral' },
    { call: { kind: 'badge', params: { fallbackTone: 'info' } }, tone: 'info' },
  ] as const)('draws a single-tone pill for $call', async ({ call, tone }) => {
    await renderGrid({
      columns: withColumn({
        cell: call,
        dataType: 'number',
        key: 'score',
        label: 'Clarity',
      }),
    });

    const badge = badgeOf({ columnKey: 'score', rowIndex: 0 });

    expect(badge.textContent).toBe('4');
    expect(styleOf(badge)).toContain(
      TABLE_CELL_BUILT_IN_TONES[tone]?.background,
    );
  });

  it('lets a renderer registered under an existing kind replace the built-in', async () => {
    const params: StandardSchemaV1<{ readonly label: string }> = {
      '~standard': {
        validate: () => ({ value: { label: 'replaced' } }),
        vendor: 'test',
        version: 1,
      },
    };
    const badge: TableCellRenderer<{ readonly label: string }> = {
      kind: 'badge',
      params,
      render: ({ params: { label }, value }) => (
        <span data-testid='replacement'>{`${label}:${String(value)}`}</span>
      ),
    };

    await renderGrid({ cellRenderers: [badge] });

    expect(
      within(cellOf({ columnKey: 'score', rowIndex: 0 })).getByTestId(
        'replacement',
      ).textContent,
    ).toBe('replaced:4');
    expect(screen.queryAllByTestId('table-cell-badge')).toHaveLength(
      ROWS.length,
    );
  });

  it('keeps every body cell a gridcell with a single tab stop', async () => {
    await renderGrid();

    const cells = screen.getAllByRole('gridcell');

    expect(
      cells.every((cell) => cell.getAttribute('role') === 'gridcell'),
    ).toBe(true);
    expect(
      cells.filter((cell) => cell.tabIndex === 0).length,
    ).toBeLessThanOrEqual(1);
  });
});
