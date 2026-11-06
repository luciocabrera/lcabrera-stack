// @vitest-environment jsdom

import type { Root } from 'react-dom/client';

import * as stylex from '@stylexjs/stylex';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { createRoutesStub, MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { lineChartFill } from '#ui/components/LineChart/LineChart.stylex';
import { accessibility } from '#ui/design-system/tokens/commons.stylex';

import type { HeatmapCell, HeatmapProps } from './Heatmap.types';

import { Heatmap } from './Heatmap.component';
import { heatmapFill } from './Heatmap.stylex';
import { heatmapAxisLabelStyles } from './HeatmapAxisLabels/HeatmapAxisLabels.stylex';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const ROWS = [
  { key: 'r1', label: 'Row 1' },
  { key: 'r2', label: 'Row 2' },
  { key: 'r3', label: 'Row 3' },
];
const COLUMNS = [
  { key: 'c1', label: 'Column 1' },
  { key: 'c2', label: 'Column 2' },
  { key: 'c3', label: 'Column 3' },
];

type CellArgs = Partial<HeatmapCell> & {
  readonly at: readonly [number, number];
};

const cell = ({ at, ...rest }: CellArgs): HeatmapCell => ({
  column: `c${String(at[1])}`,
  label: `Cell ${String(at[0])}-${String(at[1])}`,
  row: `r${String(at[0])}`,
  ...rest,
});

const linkedCell = ({ at, ...rest }: CellArgs) =>
  cell({
    at,
    to: `/cells/${String(at[0])}/${String(at[1])}`,
    ...rest,
  });

const FULL_LINKED = [1, 2, 3].flatMap((row) =>
  [1, 2, 3].map((column) => linkedCell({ at: [row, column] })),
);

const renderHeatmap = (props: Partial<HeatmapProps> = {}) =>
  render(
    <MemoryRouter>
      <Heatmap
        cells={[]}
        columns={COLUMNS}
        rows={ROWS}
        title='Grid'
        {...props}
      />
    </MemoryRouter>,
  );

const getPlot = (container: Element) => {
  const plot = container.querySelector('svg[viewBox]');

  if (plot === null) throw new Error('no plot');

  return plot;
};

const getRects = (container: Element) => [
  ...getPlot(container).querySelectorAll('rect'),
];

type GetRectArgs = {
  readonly container: Element;
  readonly name: string;
};

const getRect = ({ container, name }: GetRectArgs) => {
  const rect = getRects(container).find(
    (node) => node.querySelector('title')?.textContent === name,
  );

  if (rect === undefined) throw new Error(`no rect named ${name}`);

  return rect;
};

const getLink = (name: string) => screen.getByRole('link', { name });

const getTabStops = (container: Element) =>
  [...container.querySelectorAll('[data-heatmap-cell][tabindex="0"]')].map(
    (node) => node.getAttribute('aria-label'),
  );

const getPatternFill = (id: string | undefined) => `url(#${String(id)})`;

const getLegendList = (container: Element) => {
  const list = [...container.querySelectorAll('ul')].at(2);

  if (list === undefined) throw new Error('no legend');

  return list;
};

const focusLink = (name: string) => {
  const link = getLink(name);

  act(() => {
    link.focus();
  });

  return link;
};

const normalise = (html: string) => {
  const ids = new Map<string, string>();

  return html
    .replaceAll(/style="[^"]*"/gu, (style) => style.replaceAll(/[\s;]/gu, ''))
    .replaceAll(/_r_\w+_/giu, (id) => {
      if (!ids.has(id)) ids.set(id, `id-${String(ids.size)}`);

      return ids.get(id) ?? id;
    });
};

describe('Heatmap', () => {
  describe('the plot', () => {
    it('is an image named by the title and described by the description', () => {
      renderHeatmap({ description: 'Values by row and column', title: 'Grid' });

      const plot = screen.getByRole('img', { name: 'Grid' });

      expect(plot.tagName.toLowerCase()).toBe('svg');
      expect(plot.getAttribute('aria-labelledby')).toBe(
        plot.querySelector('title')?.id,
      );
      expect(plot.getAttribute('aria-describedby')).toBe(
        plot.querySelector('desc')?.id,
      );
      expect(plot.querySelector('desc')?.textContent).toBe(
        'Values by row and column',
      );
    });

    it('has no description element or reference without a description', () => {
      renderHeatmap();

      const plot = screen.getByRole('img', { name: 'Grid' });

      expect(plot.querySelector('desc')).toBeNull();
      expect(plot.getAttribute('aria-describedby')).toBeNull();
    });

    it('holds one rect per position in a single group', () => {
      const { container } = renderHeatmap({ cells: [cell({ at: [1, 1] })] });
      const groups = getPlot(container).querySelectorAll('g');

      expect(groups).toHaveLength(1);
      expect(groups[0]?.children).toHaveLength(9);
      expect(getRects(container)).toHaveLength(9);
    });

    it('holds the rects in a single group when cells are linked too', () => {
      const { container } = renderHeatmap({ cells: FULL_LINKED });
      const groups = getPlot(container).querySelectorAll('g');

      expect(groups).toHaveLength(1);
      expect(groups[0]?.children).toHaveLength(9);
    });

    it('sizes the plot and its cells from the default cell size', () => {
      const { container } = renderHeatmap();
      const plot = getPlot(container);
      const lastRect = getRect({
        container,
        name: 'Row 3, Column 3: No value',
      });

      expect(plot.getAttribute('width')).toBe('48');
      expect(plot.getAttribute('height')).toBe('48');
      expect(plot.getAttribute('viewBox')).toBe('0 0 48 48');
      expect(lastRect.getAttribute('x')).toBe('32');
      expect(lastRect.getAttribute('y')).toBe('32');
      expect(lastRect.getAttribute('width')).toBe('15');
      expect(lastRect.getAttribute('height')).toBe('15');
    });

    it('sizes the plot and its cells from cellSize', () => {
      const { container } = renderHeatmap({ cellSize: 30 });
      const plot = getPlot(container);
      const lastRect = getRect({
        container,
        name: 'Row 3, Column 3: No value',
      });

      expect(plot.getAttribute('width')).toBe('90');
      expect(plot.getAttribute('viewBox')).toBe('0 0 90 90');
      expect(lastRect.getAttribute('x')).toBe('60');
      expect(lastRect.getAttribute('width')).toBe('29');
    });

    it('renders empty axes without a cell', () => {
      const { container } = renderHeatmap({ columns: [], rows: [] });

      expect(getRects(container)).toHaveLength(0);
      expect(getPlot(container).getAttribute('viewBox')).toBe('0 0 0 0');
    });
  });

  describe('the tone scale', () => {
    it('is the default and fills a cell with its tone', () => {
      const { container } = renderHeatmap({
        cells: [cell({ at: [1, 1], tone: 'error', value: 100 })],
      });

      expect(
        getRect({ container, name: 'Cell 1-1' }).getAttribute('class'),
      ).toBe(stylex.props(lineChartFill.error).className);
    });

    it('fills a cell without a tone with the neutral tone', () => {
      const { container } = renderHeatmap({
        cells: [cell({ at: [1, 1] })],
        scale: { kind: 'tone' },
      });

      expect(
        getRect({ container, name: 'Cell 1-1' }).getAttribute('class'),
      ).toBe(stylex.props(lineChartFill.neutral).className);
    });
  });

  describe('the sequential scale', () => {
    const scale = { domain: [0, 10], kind: 'sequential' } as const;

    it('mixes two colour tokens at the position of the value', () => {
      const { container } = renderHeatmap({
        cells: [
          cell({ at: [1, 1], value: 4 }),
          cell({ at: [1, 2], value: 40 }),
        ],
        scale,
      });
      const low = getRect({ container, name: 'Cell 1-1' });
      const high = getRect({ container, name: 'Cell 1-2' });

      expect(low.getAttribute('class')).toBe(
        stylex.props(heatmapFill.sequential('40%')).className,
      );
      expect(low.getAttribute('style')).toContain('color-mix');
      expect(low.getAttribute('style')).toContain('40%');
      expect(high.getAttribute('style')).toContain('100%');
    });

    it('uses the tone of a cell with no value', () => {
      const { container } = renderHeatmap({
        cells: [cell({ at: [1, 1], tone: 'warning' })],
        scale,
      });

      expect(
        getRect({ container, name: 'Cell 1-1' }).getAttribute('class'),
      ).toBe(stylex.props(lineChartFill.warning).className);
    });
  });

  describe('missing cells', () => {
    it('draws one empty, named by its row and column', () => {
      const { container } = renderHeatmap({ cells: [cell({ at: [1, 1] })] });

      expect(
        getRect({
          container,
          name: 'Row 2, Column 3: No value',
        }).getAttribute('class'),
      ).toBe(stylex.props(heatmapFill.empty).className);
    });

    it('draws one empty under a sequential scale too', () => {
      const { container } = renderHeatmap({
        scale: { domain: [0, 1], kind: 'sequential' },
      });

      expect(
        getRect({
          container,
          name: 'Row 1, Column 1: No value',
        }).getAttribute('class'),
      ).toBe(stylex.props(heatmapFill.empty).className);
    });
  });

  describe('patterns', () => {
    it('defines nothing when nothing names a pattern', () => {
      const { container } = renderHeatmap({ cells: [cell({ at: [1, 1] })] });

      expect(container.querySelector('defs')).toBeNull();
    });

    it('defines each used pattern once and paints the cells with it', () => {
      const { container } = renderHeatmap({
        cells: [
          cell({ at: [1, 1], pattern: 'hatch' }),
          cell({ at: [1, 2], pattern: 'hatch' }),
          cell({ at: [2, 1], pattern: 'dots' }),
        ],
      });
      const patterns = [...container.querySelectorAll('pattern')];
      const [dots, hatch] = patterns;
      const fills = getRects(container).map((rect) =>
        rect.getAttribute('fill'),
      );

      expect(container.querySelectorAll('defs')).toHaveLength(1);
      expect(patterns).toHaveLength(2);
      expect(dots?.querySelector('circle')?.getAttribute('r')).toBe('1.5');
      expect(dots?.querySelector('circle')?.getAttribute('cx')).toBe('3');
      expect(dots?.querySelector('circle')?.getAttribute('cy')).toBe('3');
      expect(hatch?.querySelector('path')?.getAttribute('d')).toBe('M0,0V6');
      expect(dots?.getAttribute('width')).toBe('6');
      expect(hatch?.getAttribute('height')).toBe('6');
      expect(
        fills.filter((fill) => fill === getPatternFill(hatch?.id)),
      ).toHaveLength(2);
      expect(
        fills.filter((fill) => fill === getPatternFill(dots?.id)),
      ).toHaveLength(1);
    });

    it('gives two heatmaps on one page different pattern ids', () => {
      const { container } = render(
        <>
          <Heatmap
            cells={[cell({ at: [1, 1], pattern: 'dots' })]}
            columns={COLUMNS}
            rows={ROWS}
            title='First'
          />
          <Heatmap
            cells={[cell({ at: [1, 1], pattern: 'dots' })]}
            columns={COLUMNS}
            rows={ROWS}
            title='Second'
          />
        </>,
      );
      const ids = [...container.querySelectorAll('pattern')].map(
        ({ id }) => id,
      );

      expect(ids).toHaveLength(2);
      expect(new Set(ids).size).toBe(2);
    });

    it('defines only the pattern in use', () => {
      const { container } = renderHeatmap({
        cells: [cell({ at: [1, 1], pattern: 'dots' })],
      });

      expect(container.querySelectorAll('pattern')).toHaveLength(1);
      expect(container.querySelector('circle')).not.toBeNull();
      expect(container.querySelector('path')).toBeNull();
    });

    it('defines the hatch alone when only it is in use', () => {
      const { container } = renderHeatmap({
        cells: [cell({ at: [1, 1], pattern: 'hatch' })],
      });

      expect(container.querySelectorAll('pattern')).toHaveLength(1);
      expect(container.querySelector('path')).not.toBeNull();
      expect(container.querySelector('circle')).toBeNull();
    });

    it('keeps the fill of a patterned cell under its pattern', () => {
      const { container } = renderHeatmap({
        cells: [cell({ at: [1, 1], pattern: 'hatch', tone: 'success' })],
      });
      const base = getRect({ container, name: 'Cell 1-1' });
      const overlay = base.nextElementSibling;

      expect(base.getAttribute('class')).toBe(
        stylex.props(lineChartFill.success).className,
      );
      expect(overlay?.getAttribute('fill')).toBe(
        getPatternFill(container.querySelector('pattern')?.id),
      );
      expect(overlay?.getAttribute('x')).toBe(base.getAttribute('x'));
      expect(overlay?.getAttribute('y')).toBe(base.getAttribute('y'));
      expect(overlay?.getAttribute('width')).toBe(base.getAttribute('width'));
      expect(overlay?.getAttribute('height')).toBe(base.getAttribute('height'));
    });
  });

  describe('axis labels', () => {
    it('writes each label as text when it has no link', () => {
      renderHeatmap();

      expect(screen.getByText('Row 2').tagName).toBe('LI');
      expect(screen.getByText('Column 3').tagName).toBe('LI');
      expect(screen.queryByRole('link')).toBeNull();
    });

    it('makes a row label and a column label links when they have `to`', () => {
      renderHeatmap({
        columns: [{ key: 'c1', label: 'Column 1', to: '/columns/1' }],
        rows: [{ key: 'r1', label: 'Row 1', to: '/rows/1' }],
      });

      expect(getLink('Row 1').getAttribute('href')).toBe('/rows/1');
      expect(getLink('Column 1').getAttribute('href')).toBe('/columns/1');
      expect(screen.getByRole('img', { name: 'Grid' })).toBeTruthy();
    });

    it('lays each axis out from the cell size', () => {
      const { container } = renderHeatmap({ cellSize: 22 });
      const [columnList, rowList] = container.querySelectorAll('ul');

      expect(columnList?.textContent).toBe('Column 1Column 2Column 3');
      expect(rowList?.textContent).toBe('Row 1Row 2Row 3');
      expect(columnList?.getAttribute('style')).toContain('22px');
      expect(rowList?.getAttribute('style')).toContain('22px');
      expect(columnList?.getAttribute('class')).toContain(
        stylex.props(heatmapAxisLabelStyles.column('22px')).className,
      );
      expect(rowList?.getAttribute('class')).toContain(
        stylex.props(heatmapAxisLabelStyles.row('22px')).className,
      );
    });

    it('rotates only the column labels', () => {
      renderHeatmap();

      const rotation = stylex.props(
        heatmapAxisLabelStyles.columnItem,
      ).className;

      expect(screen.getByText('Column 1').getAttribute('class')).toContain(
        rotation,
      );
      expect(screen.getByText('Row 1').getAttribute('class')).not.toContain(
        rotation,
      );
    });

    it('titles each label, so a clipped one can still be read', () => {
      renderHeatmap();

      expect(screen.getByText('Row 1').getAttribute('title')).toBe('Row 1');
    });
  });

  describe('linked cells', () => {
    it('turn the plot into a grid of rows and cells named by the title', () => {
      renderHeatmap({
        cells: [linkedCell({ at: [1, 1] })],
        description: 'Described',
        title: 'Linked grid',
      });

      const grid = screen.getByRole('grid', { name: 'Linked grid' });
      const rows = within(grid).getAllByRole('row');

      expect(screen.queryByRole('img', { name: 'Linked grid' })).toBeNull();
      expect(rows).toHaveLength(3);
      expect(
        rows.map((row) => within(row).getAllByRole('cell').length),
      ).toEqual([3, 3, 3]);
      expect(
        document.getElementById(grid.getAttribute('aria-describedby') ?? ''),
      ).toHaveProperty('textContent', 'Described');
    });

    it('hide the rects from the accessibility tree, with their titles gone', () => {
      const { container } = renderHeatmap({
        cells: [linkedCell({ at: [1, 1] })],
        description: 'Described',
      });
      const plot = getPlot(container);

      expect(plot.getAttribute('aria-hidden')).toBe('true');
      expect(plot.getAttribute('aria-describedby')).toBeNull();
      expect(plot.getAttribute('role')).toBeNull();
      expect(plot.getAttribute('aria-labelledby')).toBeNull();
      expect(getRects(container)).toHaveLength(9);
      expect(
        getRects(container).filter((rect) => rect.querySelector('title')),
      ).toHaveLength(0);
    });

    it('have no description reference without a description', () => {
      renderHeatmap({ cells: [linkedCell({ at: [1, 1] })] });

      expect(
        screen.getByRole('grid').getAttribute('aria-describedby'),
      ).toBeNull();
    });

    it('are router links named by their label', () => {
      renderHeatmap({ cells: [linkedCell({ at: [2, 3] })] });

      const link = getLink('Cell 2-3');

      expect(link.getAttribute('href')).toBe('/cells/2/3');
      expect(link.getAttribute('title')).toBe('Cell 2-3');
      expect(link.parentElement?.tagName).toBe('TD');
    });

    it('leave a cell without `to` as a named cell with no link', () => {
      renderHeatmap({
        cells: [linkedCell({ at: [1, 1] }), cell({ at: [1, 2] })],
      });

      expect(screen.getAllByRole('link')).toHaveLength(1);
      expect(
        screen.getByRole('cell', { name: 'Cell 1-2' }).getAttribute('title'),
      ).toBe('Cell 1-2');
      expect(
        screen.getByRole('cell', { name: 'Row 3, Column 3: No value' }),
      ).toBeTruthy();
    });

    it('place the link in the same row and column as its rect', () => {
      renderHeatmap({ cells: [linkedCell({ at: [2, 3] })] });

      const gridCell = getLink('Cell 2-3').parentElement;
      const row = gridCell?.parentElement;

      expect(gridCell).toHaveProperty('cellIndex', 2);
      expect(row).toHaveProperty('rowIndex', 1);
    });

    it('still fill the rect under the link, with its pattern', () => {
      const { container } = renderHeatmap({
        cells: [
          linkedCell({ at: [1, 1], pattern: 'dots', tone: 'info' }),
          linkedCell({ at: [1, 2], tone: 'error' }),
        ],
      });
      const [first, overlay, second] = getRects(container);

      expect(first?.getAttribute('class')).toBe(
        stylex.props(lineChartFill.info).className,
      );
      expect(overlay?.getAttribute('fill')).toBe(
        getPatternFill(container.querySelector('pattern')?.id),
      );
      expect(second?.getAttribute('class')).toBe(
        stylex.props(lineChartFill.error).className,
      );
    });

    it('navigate through the router on a click', async () => {
      const Stub = createRoutesStub([
        {
          Component: () => (
            <Heatmap
              cells={[linkedCell({ at: [1, 1] })]}
              columns={COLUMNS}
              rows={ROWS}
              title='Grid'
            />
          ),
          path: '/',
        },
        { Component: () => <p>Arrived</p>, path: '/cells/1/1' },
      ]);

      render(<Stub initialEntries={['/']} />);

      fireEvent.click(await screen.findByRole('link', { name: 'Cell 1-1' }));

      expect(await screen.findByText('Arrived')).toBeTruthy();
    });
  });

  describe('keyboard movement', () => {
    it('gives the first linked cell the single tab stop', () => {
      const { container } = renderHeatmap({
        cells: [
          linkedCell({ at: [2, 2] }),
          linkedCell({ at: [3, 1] }),
          cell({ at: [1, 1] }),
        ],
      });

      expect(getTabStops(container)).toEqual(['Cell 2-2']);
      expect(getLink('Cell 3-1').getAttribute('tabindex')).toBe('-1');
    });

    it.each([
      { end: 'Cell 2-3', key: 'ArrowRight' },
      { end: 'Cell 2-1', key: 'ArrowLeft' },
      { end: 'Cell 1-2', key: 'ArrowUp' },
      { end: 'Cell 3-2', key: 'ArrowDown' },
      { end: 'Cell 2-1', key: 'Home' },
      { end: 'Cell 2-3', key: 'End' },
    ])('$key moves focus and the tab stop to $end', ({ end, key }) => {
      const { container } = renderHeatmap({ cells: FULL_LINKED });
      const start = focusLink('Cell 2-2');

      expect(document.activeElement).toBe(start);
      expect(getTabStops(container)).toEqual(['Cell 2-2']);

      fireEvent.keyDown(start, { key });

      expect(document.activeElement).toBe(getLink(end));
      expect(getTabStops(container)).toEqual([end]);
      expect(start.getAttribute('tabindex')).toBe('-1');
    });

    it.each([
      { end: 'Cell 1-1', key: 'Home', modifier: { ctrlKey: true } },
      { end: 'Cell 3-3', key: 'End', modifier: { metaKey: true } },
    ])(
      '$key with a modifier moves to the corner $end',
      ({ end, key, modifier }) => {
        renderHeatmap({ cells: FULL_LINKED });

        fireEvent.keyDown(focusLink('Cell 2-2'), { key, ...modifier });

        expect(document.activeElement).toBe(getLink(end));
      },
    );

    it('skips the cells without a link', () => {
      renderHeatmap({
        cells: [
          linkedCell({ at: [1, 1] }),
          cell({ at: [1, 2] }),
          linkedCell({ at: [1, 3] }),
        ],
      });

      fireEvent.keyDown(focusLink('Cell 1-1'), { key: 'ArrowRight' });

      expect(document.activeElement).toBe(getLink('Cell 1-3'));
    });

    it('stops the page scrolling for a key it handles, at an edge as well', () => {
      renderHeatmap({ cells: FULL_LINKED });

      const start = focusLink('Cell 1-1');

      expect(fireEvent.keyDown(start, { key: 'ArrowUp' })).toBe(false);
      expect(document.activeElement).toBe(start);
    });

    it('leaves any other key to the browser', () => {
      renderHeatmap({ cells: FULL_LINKED });

      const start = focusLink('Cell 2-2');

      expect(fireEvent.keyDown(start, { key: 'Enter' })).toBe(true);
      expect(fireEvent.keyDown(start, { key: 'Tab' })).toBe(true);
      expect(document.activeElement).toBe(start);
    });

    it('leaves an Alt-arrow history shortcut to the browser', () => {
      renderHeatmap({ cells: FULL_LINKED });

      const start = focusLink('Cell 2-2');

      expect(fireEvent.keyDown(start, { altKey: true, key: 'ArrowLeft' })).toBe(
        true,
      );
      expect(document.activeElement).toBe(start);
    });

    it('follows focus that arrives without the keyboard', () => {
      const { container } = renderHeatmap({ cells: FULL_LINKED });

      focusLink('Cell 3-3');

      expect(getTabStops(container)).toEqual(['Cell 3-3']);
    });

    it('ignores a focus event that lands on no cell', () => {
      const { container } = renderHeatmap({ cells: FULL_LINKED });

      focusLink('Cell 2-2');
      fireEvent.focus(screen.getByRole('grid', { name: 'Grid' }));

      expect(getTabStops(container)).toEqual(['Cell 2-2']);
    });

    it('moves between cells whose keys hold selector characters', () => {
      renderHeatmap({
        cells: [
          { column: 'a"b', label: 'First', row: String.raw`x\y`, to: '/first' },
          {
            column: 'c]d',
            label: 'Second',
            row: String.raw`x\y`,
            to: '/second',
          },
        ],
        columns: [
          { key: 'a"b', label: 'A' },
          { key: 'c]d', label: 'C' },
        ],
        rows: [{ key: String.raw`x\y`, label: 'X' }],
      });

      fireEvent.keyDown(focusLink('First'), { key: 'ArrowRight' });

      expect(document.activeElement).toBe(getLink('Second'));
    });

    it('falls back to the first linked cell when the tab stop leaves the data', () => {
      const props = {
        columns: COLUMNS,
        rows: ROWS,
        title: 'Grid',
      };
      const { container, rerender } = render(
        <MemoryRouter>
          <Heatmap {...props} cells={FULL_LINKED} />
        </MemoryRouter>,
      );

      focusLink('Cell 3-3');
      rerender(
        <MemoryRouter>
          <Heatmap
            {...props}
            cells={[linkedCell({ at: [1, 2] }), linkedCell({ at: [2, 2] })]}
          />
        </MemoryRouter>,
      );

      expect(getTabStops(container)).toEqual(['Cell 1-2']);
    });

    it('keeps the tab stop on its cell when the rows around it reorder', () => {
      const props = {
        columns: COLUMNS,
        title: 'Grid',
      };
      const { container, rerender } = render(
        <MemoryRouter>
          <Heatmap {...props} cells={FULL_LINKED} rows={ROWS} />
        </MemoryRouter>,
      );

      focusLink('Cell 1-2');
      rerender(
        <MemoryRouter>
          <Heatmap {...props} cells={FULL_LINKED} rows={ROWS.toReversed()} />
        </MemoryRouter>,
      );

      expect(getTabStops(container)).toEqual(['Cell 1-2']);
      expect(getLink('Cell 1-2').getAttribute('tabindex')).toBe('0');
    });
  });

  describe('the legend', () => {
    it('is absent by default and for an empty list', () => {
      const { container, rerender } = renderHeatmap();

      expect(container.querySelectorAll('ul')).toHaveLength(2);

      rerender(
        <MemoryRouter>
          <Heatmap
            cells={[]}
            columns={COLUMNS}
            legend={[]}
            rows={ROWS}
            title='Grid'
          />
        </MemoryRouter>,
      );

      expect(container.querySelectorAll('ul')).toHaveLength(2);
    });

    it('writes a label with a hidden swatch for each entry', () => {
      const { container } = renderHeatmap({
        legend: [
          { label: 'Failed', tone: 'error' },
          { label: 'Hatched', pattern: 'hatch', tone: 'warning' },
          { label: 'Other' },
        ],
      });
      const items = within(getLegendList(container)).getAllByRole('listitem');

      expect(items.map(({ textContent }) => textContent)).toEqual([
        'Failed',
        'Hatched',
        'Other',
      ]);
      expect(items[0]?.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
        'true',
      );
      expect(items[0]?.querySelector('svg')?.getAttribute('width')).toBe('12');
      expect(items[0]?.querySelectorAll('rect')).toHaveLength(1);
      expect(items[0]?.querySelector('rect')?.getAttribute('class')).toBe(
        stylex.props(lineChartFill.error).className,
      );
      expect(items[2]?.querySelector('rect')?.getAttribute('class')).toBe(
        stylex.props(lineChartFill.neutral).className,
      );
    });

    it('paints a swatch with the pattern the plot defines', () => {
      const { container } = renderHeatmap({
        legend: [{ label: 'Hatched', pattern: 'hatch', tone: 'warning' }],
      });
      const rects = getLegendList(container).querySelectorAll('rect');

      expect(rects).toHaveLength(2);
      expect(rects[1]?.getAttribute('fill')).toBe(
        getPatternFill(container.querySelector('pattern')?.id),
      );
      expect(getLegendList(container).querySelector('pattern')).toBeNull();
    });

    it('shows the domain of a sequential scale around a ramp', () => {
      const { container } = renderHeatmap({
        scale: { domain: [5, 95], kind: 'sequential' },
      });
      const [ramp] = within(getLegendList(container)).getAllByRole('listitem');

      expect(ramp?.childNodes[0]?.textContent).toBe('5');
      expect(ramp?.childNodes[2]?.textContent).toBe('95');
      expect(ramp?.querySelector('span')?.getAttribute('aria-hidden')).toBe(
        'true',
      );
    });

    it('lists the ramp before the entries', () => {
      const { container } = renderHeatmap({
        legend: [{ label: 'Failed', tone: 'error' }],
        scale: { domain: [0, 1], kind: 'sequential' },
      });
      const items = within(getLegendList(container)).getAllByRole('listitem');

      expect(items.map(({ textContent }) => textContent)).toEqual([
        '01',
        'Failed',
      ]);
    });
  });

  describe('the data table', () => {
    it('is absent by default and when the flag is off', () => {
      renderHeatmap();
      expect(screen.queryByRole('table')).toBeNull();

      cleanup();
      renderHeatmap({ hasDataTable: false });
      expect(screen.queryByRole('table')).toBeNull();
    });

    it('is captioned by the title and lists every position', () => {
      renderHeatmap({
        cells: [cell({ at: [1, 2] }), linkedCell({ at: [2, 1] })],
        hasDataTable: true,
        title: 'Grid',
      });

      const table = screen.getByRole('table', { name: 'Grid' });
      const [, firstRow] = within(table).getAllByRole('row');

      expect(
        within(table)
          .getAllByRole('columnheader')
          .map(({ textContent }) => textContent),
      ).toEqual(['Column 1', 'Column 2', 'Column 3']);
      expect(
        within(table)
          .getAllByRole('rowheader')
          .map(({ textContent }) => textContent),
      ).toEqual(['Row 1', 'Row 2', 'Row 3']);
      expect(
        [...(firstRow?.querySelectorAll('td') ?? [])].map(
          ({ textContent }) => textContent,
        ),
      ).toEqual([
        'Row 1, Column 1: No value',
        'Cell 1-2',
        'Row 1, Column 3: No value',
      ]);
    });

    it('adds no tab stop, so the plot keeps the only one for its cells', () => {
      renderHeatmap({
        cells: [linkedCell({ at: [1, 1] })],
        hasDataTable: true,
      });

      expect(
        within(screen.getByRole('table', { name: 'Grid' })).queryByRole('link'),
      ).toBeNull();
      expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('is visually hidden', () => {
      renderHeatmap({ hasDataTable: true });

      expect(
        screen.getByRole('table', { name: 'Grid' }).getAttribute('class'),
      ).toBe(stylex.props(accessibility.visuallyHidden).className);
    });
  });

  describe('server and client markup', () => {
    const FULL: HeatmapProps = {
      cells: [
        linkedCell({ at: [1, 1], pattern: 'hatch', tone: 'error' }),
        cell({ at: [1, 2], pattern: 'dots', value: 3 }),
        cell({ at: [2, 1], value: 7 }),
      ],
      columns: [
        ...COLUMNS.slice(0, 2),
        { key: 'c3', label: 'Column 3', to: '/columns/3' },
      ],
      description: 'Every branch at once',
      hasDataTable: true,
      legend: [
        { label: 'Hatched', pattern: 'hatch', tone: 'error' },
        { label: 'Dotted', pattern: 'dots' },
      ],
      rows: [{ key: 'r1', label: 'Row 1', to: '/rows/1' }, ...ROWS.slice(1)],
      scale: { domain: [0, 10], kind: 'sequential' },
      title: 'Grid',
    };

    const tree = (
      <MemoryRouter>
        <Heatmap {...FULL} />
      </MemoryRouter>
    );

    it('renders the same markup on the server and the client', () => {
      const serverHtml = renderToString(tree);
      const { container } = render(tree);

      expect(normalise(container.firstElementChild?.outerHTML ?? '')).toBe(
        normalise(serverHtml),
      );
      expect(serverHtml).toContain('role="grid"');
    });

    it('renders the same markup when nothing is linked', () => {
      const plain = (
        <Heatmap
          cells={[cell({ at: [1, 1], tone: 'info' })]}
          columns={COLUMNS}
          rows={ROWS}
          title='Plain'
        />
      );
      const serverHtml = renderToString(plain);
      const { container } = render(plain);

      expect(normalise(container.firstElementChild?.outerHTML ?? '')).toBe(
        normalise(serverHtml),
      );
      expect(serverHtml).toContain('role="img"');
    });

    it('hydrates the server markup with no recoverable error', () => {
      const onRecoverableError = vi.fn();
      const consoleError = vi.spyOn(console, 'error');
      const host = document.createElement('div');

      host.innerHTML = renderToString(tree);
      document.body.append(host);

      let root: Root | undefined;

      act(() => {
        root = hydrateRoot(host, tree, { onRecoverableError });
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      expect(host.querySelector('[role="grid"]')).not.toBeNull();

      act(() => {
        root?.unmount();
      });
      host.remove();
    });
  });
});
