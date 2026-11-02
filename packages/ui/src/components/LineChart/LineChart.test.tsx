// @vitest-environment jsdom

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

import type { LineChartProps, LineSeries } from './LineChart.types';

import { LineChart } from './LineChart.component';
import { lineChartLayout } from './LineChart.stylex';
import { lineChartLegendStyles } from './LineChartLegend/LineChartLegend.stylex';

const GAP: null = JSON.parse('null');

afterEach(cleanup);

const LATENCY: LineSeries = {
  id: 'latency',
  label: 'Latency',
  points: [
    { x: 0, y: 10 },
    { x: 1, y: 20 },
    { x: 2, y: GAP },
    { x: 3, y: 30 },
    { x: 4, y: 40 },
  ],
};

const THROUGHPUT: LineSeries = {
  id: 'throughput',
  isDashed: true,
  label: 'Throughput',
  points: [
    { x: 0, y: 5 },
    { x: 4, y: 15 },
  ],
  tone: 'success',
};

const renderChart = (props: Partial<LineChartProps> = {}) =>
  render(
    <MemoryRouter>
      <LineChart series={[LATENCY]} title='Request latency' {...props} />
    </MemoryRouter>,
  );

type PathsInArgs = {
  readonly container: HTMLElement;
  readonly selector: string;
};

type TitledPathArgs = {
  readonly container: HTMLElement;
  readonly name: string;
};

const pathsIn = ({ container, selector }: PathsInArgs) =>
  [...container.querySelectorAll<SVGPathElement>(selector)].map((path) =>
    path.getAttribute('d'),
  );

const normaliseMarkup = (html: string) => {
  const host = document.createElement('div');
  const ids = new Map<string, string>();

  host.innerHTML = html;

  for (const element of host.querySelectorAll<HTMLElement>('[style]')) {
    element.setAttribute('style', element.style.cssText);
  }

  return host.outerHTML.replaceAll(/_r_\w+_/giu, (id) => {
    if (!ids.has(id)) ids.set(id, `id-${String(ids.size)}`);

    return ids.get(id) ?? id;
  });
};

const titledPath = ({ container, name }: TitledPathArgs) =>
  [...container.querySelectorAll(':scope path > title')].find(
    (title) => title.textContent === name,
  )?.parentElement;

describe('LineChart', () => {
  describe('roles and names', () => {
    it('names the chart by its title as an image', () => {
      renderChart();

      expect(screen.getByRole('img', { name: 'Request latency' })).toBeTruthy();
    });

    it('describes the chart by its description when one is given', () => {
      renderChart({ description: 'Milliseconds per request' });

      expect(
        screen
          .getByRole('img', { name: 'Request latency' })
          .getAttribute('aria-describedby'),
      ).toBe(screen.getByText('Milliseconds per request').getAttribute('id'));
    });

    it('leaves the chart undescribed without a description', () => {
      const { container } = renderChart();

      expect(container.querySelector('desc')).toBeNull();
      expect(
        screen
          .getByRole('img', { name: 'Request latency' })
          .hasAttribute('aria-describedby'),
      ).toBe(false);
    });

    it('takes the group role when a point is a link, so the link stays reachable', () => {
      renderChart({
        series: [{ ...LATENCY, points: [{ to: '/requests/1', x: 0, y: 10 }] }],
      });

      expect(
        screen.getByRole('group', { name: 'Request latency' }),
      ).toBeTruthy();
      expect(screen.queryByRole('img')).toBeNull();
    });

    it('draws one plot with a viewBox that does not keep its aspect ratio', () => {
      const { container } = renderChart();
      const plots = container.querySelectorAll(':scope svg');

      expect(plots).toHaveLength(1);
      expect(plots[0]?.getAttribute('viewBox')).toBe('0 0 100 100');
      expect(plots[0]?.getAttribute('preserveAspectRatio')).toBe('none');
    });

    it('gives the line a title naming its series', () => {
      const { container } = renderChart();

      expect(
        titledPath({ container, name: 'Latency' })?.getAttribute('d'),
      ).toMatch(/^M/u);
    });
  });

  describe('lines and gaps', () => {
    it('draws each series as one path and breaks it at a null value', () => {
      const { container } = renderChart();
      const line =
        titledPath({ container, name: 'Latency' })?.getAttribute('d') ?? '';

      expect(line).toBe('M0,100L25,66.67M75,33.33L100,0');
    });

    it('draws a lone point between two gaps as a zero-length segment', () => {
      const { container } = renderChart({
        series: [
          {
            ...LATENCY,
            points: [
              { x: 0, y: 0 },
              { x: 1, y: GAP },
              { x: 2, y: 5 },
              { x: 3, y: GAP },
              { x: 4, y: 10 },
            ],
          },
        ],
      });

      expect(
        titledPath({ container, name: 'Latency' })?.getAttribute('d'),
      ).toBe('M0,100L0,100M50,50L50,50M100,0L100,0');
    });

    it('dashes a series that asks for it and keeps the other solid', () => {
      const { container } = renderChart({ series: [LATENCY, THROUGHPUT] });
      const dashed = titledPath({
        container,
        name: 'Throughput',
      })?.getAttribute('class');
      const solid = titledPath({
        container,
        name: 'Latency',
      })?.getAttribute('class');

      expect(dashed).not.toBe(solid);
      expect(dashed?.split(' ').length).toBeGreaterThan(
        solid?.split(' ').length ?? 0,
      );
    });

    it('colours each series from its tone, or from the palette by position', () => {
      const { container } = renderChart({
        series: [
          LATENCY,
          { ...THROUGHPUT, isDashed: false, tone: undefined },
          {
            ...THROUGHPUT,
            id: 'toned',
            isDashed: false,
            label: 'Toned',
            tone: 'warning',
          },
        ],
      });
      const classes = ['Latency', 'Throughput', 'Toned'].map((name) =>
        titledPath({ container, name: name })?.getAttribute('class'),
      );

      expect(new Set(classes).size).toBe(3);
    });

    it('thins a series with more points than the plot is wide', () => {
      const long: LineSeries = {
        id: 'long',
        label: 'Long',
        points: Array.from({ length: 5000 }, (_, x) => ({
          x,
          y: Math.sin(x / 50),
        })),
      };
      const { container } = renderChart({ points: 'never', series: [long] });
      const line =
        titledPath({ container, name: 'Long' })?.getAttribute('d') ?? '';

      expect(line.split('L')).toHaveLength(1000);
    });
  });

  describe('band', () => {
    it('shades the band between its lower and upper bounds as its own path', () => {
      const { container } = renderChart({
        series: [
          {
            ...LATENCY,
            band: [
              { lower: 0, upper: 20, x: 0 },
              { lower: 20, upper: 40, x: 4 },
            ],
          },
        ],
      });
      const shaded = pathsIn({
        container,
        selector: ':scope svg > path:not(:has(title))',
      }).filter((d) => d?.endsWith('Z'));

      expect(shaded).toEqual(['M0,50L100,0L100,50L0,100Z']);
    });

    it('draws no band for a series without one', () => {
      const { container } = renderChart();

      expect(
        pathsIn({ container, selector: ':scope svg > path' }).filter((d) =>
          d?.endsWith('Z'),
        ),
      ).toEqual([]);
    });
  });

  describe('markers', () => {
    it('draws a marker as a full-height line named by its label', () => {
      const { container } = renderChart({
        markers: [{ label: 'Deploy', x: 2 }],
      });

      expect(titledPath({ container, name: 'Deploy' })?.getAttribute('d')).toBe(
        'M50,0L50,100',
      );
    });

    it('labels a marker in HTML placed at its position', () => {
      renderChart({ markers: [{ label: 'Deploy', x: 2 }] });

      const label = screen.getByRole('listitem');

      expect(label.textContent).toBe('Deploy');
      expect(label.tagName).toBe('LI');
      expect(label.getAttribute('style')).toContain('50%');
      expect(within(label).queryByRole('link')).toBeNull();
    });

    it('colours markers from their tone, neutral by default', () => {
      const { container } = renderChart({
        markers: [
          { label: 'Deploy', x: 1 },
          { label: 'Outage', tone: 'error', x: 3 },
        ],
      });

      expect(
        titledPath({ container, name: 'Deploy' })?.getAttribute('class'),
      ).not.toBe(
        titledPath({ container, name: 'Outage' })?.getAttribute('class'),
      );
    });

    it('links a marker label that has a destination', () => {
      renderChart({
        markers: [{ label: 'Deploy', to: '/deploys/7', x: 2 }],
      });

      expect(
        screen.getByRole('link', { name: 'Deploy' }).getAttribute('href'),
      ).toBe('/deploys/7');
    });

    it('drops a marker outside the domain or without a finite position', () => {
      const { container } = renderChart({
        markers: [
          { label: 'Early', x: -10 },
          { label: 'Nowhere', x: NaN },
        ],
        xAxis: { domain: [0, 4] },
      });

      expect(titledPath({ container, name: 'Early' })).toBeUndefined();
      expect(titledPath({ container, name: 'Nowhere' })).toBeUndefined();
      expect(screen.queryByRole('list')).toBeNull();
    });
  });

  describe('dots', () => {
    it('renders a linked point as a router link named by its label', () => {
      renderChart({
        series: [
          {
            ...LATENCY,
            points: [
              { label: 'Request 1: 10 ms', to: '/requests/1', x: 0, y: 10 },
              { x: 1, y: 20 },
            ],
          },
        ],
      });

      const link = screen.getByRole('link', { name: 'Request 1: 10 ms' });

      expect(link.getAttribute('href')).toBe('/requests/1');
      expect(link.querySelector(':scope path > title')?.textContent).toBe(
        'Request 1: 10 ms',
      );
    });

    it('navigates through the router when a linked point is followed', async () => {
      const Stub = createRoutesStub([
        {
          Component: () => (
            <LineChart
              series={[
                {
                  ...LATENCY,
                  points: [{ label: 'First', to: '/requests/1', x: 0, y: 1 }],
                },
              ]}
              title='Request latency'
            />
          ),
          path: '/',
        },
        { Component: () => <p>Request one</p>, path: '/requests/1' },
      ]);

      render(<Stub initialEntries={['/']} />);

      fireEvent.click(await screen.findByRole('link', { name: 'First' }));

      expect(await screen.findByText('Request one')).toBeTruthy();
    });

    it('names an unlabelled dot by its series and formatted values', () => {
      const { container } = renderChart({ points: 'always' });

      expect(
        [...container.querySelectorAll(':scope svg > path > title')].map(
          ({ textContent }) => textContent,
        ),
      ).toEqual([
        'Latency',
        'Latency: 0, 10',
        'Latency: 1, 20',
        'Latency: 3, 30',
        'Latency: 4, 40',
      ]);
    });

    it('draws a dot for every finite point of a short series in auto mode', () => {
      const { container } = renderChart();

      expect(
        container.querySelectorAll(':scope svg > path > title'),
      ).toHaveLength(5);
    });

    it('draws only linked and toned dots in auto mode once a series is long', () => {
      const long: LineSeries = {
        id: 'long',
        label: 'Long',
        points: Array.from({ length: 25 }, (_, x) => ({
          to: x === 7 ? '/points/7' : undefined,
          tone: x === 3 ? ('warning' as const) : undefined,
          x,
          y: x,
        })),
      };
      const { container } = renderChart({ series: [long] });

      expect(
        [...container.querySelectorAll(':scope svg path > title')]
          .map(({ textContent }) => textContent)
          .filter((name) => name !== 'Long'),
      ).toEqual(['Long: 3, 3', 'Long: 7, 7']);
    });

    it('draws a dot on a series of exactly the auto limit', () => {
      const { container } = renderChart({
        series: [
          {
            id: 'limit',
            label: 'Limit',
            points: Array.from({ length: 24 }, (_, x) => ({ x, y: x })),
          },
        ],
      });

      expect(
        container.querySelectorAll(':scope svg > path > title'),
      ).toHaveLength(25);
    });

    it('keeps a linked dot and drops the rest with points="never"', () => {
      const { container } = renderChart({
        points: 'never',
        series: [
          {
            ...LATENCY,
            points: [
              { tone: 'error', x: 0, y: 1 },
              { label: 'Linked', to: '/points/1', x: 1, y: 2 },
            ],
          },
        ],
      });

      expect(
        [...container.querySelectorAll(':scope svg path > title')].map(
          ({ textContent }) => textContent,
        ),
      ).toEqual(['Latency', 'Linked']);
    });

    it('colours a toned dot from its own tone over the series tone', () => {
      const { container } = renderChart({
        points: 'always',
        series: [
          {
            ...LATENCY,
            points: [
              { label: 'Plain', x: 0, y: 1 },
              { label: 'Failed', tone: 'error', x: 1, y: 2 },
            ],
          },
        ],
      });

      expect(
        titledPath({ container, name: 'Plain' })?.getAttribute('class'),
      ).not.toBe(
        titledPath({ container, name: 'Failed' })?.getAttribute('class'),
      );
    });

    it('draws no dot for a null value', () => {
      const { container } = renderChart({ points: 'always' });

      expect(
        [...container.querySelectorAll(':scope svg > path > title')].some(
          ({ textContent }) => textContent?.startsWith('Latency: 2'),
        ),
      ).toBe(false);
    });
  });

  describe('legend', () => {
    it('lists every series when there is more than one', () => {
      renderChart({ series: [LATENCY, THROUGHPUT] });

      expect(
        screen.getAllByRole('listitem').map(({ textContent }) => textContent),
      ).toEqual(['Latency', 'Throughput']);
    });

    it('lists a third series too', () => {
      renderChart({
        series: [
          LATENCY,
          THROUGHPUT,
          { ...THROUGHPUT, id: 'third', label: 'Third' },
        ],
      });

      expect(
        screen.getAllByRole('listitem').map(({ textContent }) => textContent),
      ).toEqual(['Latency', 'Throughput', 'Third']);
    });

    it('draws no legend for a single series', () => {
      renderChart();

      expect(screen.queryByRole('list')).toBeNull();
    });

    it('dashes the swatch of a dashed series only', () => {
      renderChart({
        series: [
          { ...THROUGHPUT, id: 'solid', isDashed: false, label: 'Solid' },
          { ...THROUGHPUT, id: 'dashed', label: 'Dashed' },
        ],
      });

      const dashing =
        stylex.props(lineChartLegendStyles.dashed).className ?? '';
      const [solid, dashed] = screen
        .getAllByRole('listitem')
        .map((item) => item.firstElementChild?.classList.contains(dashing));

      expect(dashing).not.toBe('');
      expect(solid).toBe(false);
      expect(dashed).toBe(true);
    });
  });

  describe('axes', () => {
    it('renders no axis label for an axis without one', () => {
      const { container } = renderChart({ xAxis: {}, yAxis: {} });
      const labelled = new Set([
        stylex.props(lineChartLayout.axisLabel, lineChartLayout.xLabel)
          .className,
        stylex.props(lineChartLayout.axisLabel, lineChartLayout.yLabel)
          .className,
      ]);

      expect(
        [...container.querySelectorAll('span')].filter((span) =>
          labelled.has(span.getAttribute('class') ?? undefined),
        ),
      ).toEqual([]);
    });

    it('labels the axes in HTML when labels are given', () => {
      renderChart({
        xAxis: { label: 'Request' },
        yAxis: { label: 'Milliseconds' },
      });

      expect(screen.getByText('Request').tagName).toBe('SPAN');
      expect(screen.getByText('Milliseconds').tagName).toBe('SPAN');
      expect(screen.getByText('Request').getAttribute('class')).toBe(
        stylex.props(lineChartLayout.axisLabel, lineChartLayout.xLabel)
          .className,
      );
      expect(screen.getByText('Milliseconds').getAttribute('class')).toBe(
        stylex.props(lineChartLayout.axisLabel, lineChartLayout.yLabel)
          .className,
      );
    });

    it('places nice ticks on both axes, with a gridline per value tick', () => {
      const { container } = renderChart();
      const [yTicks, xTicks] = [
        ...container.querySelectorAll('[aria-hidden="true"]'),
      ];

      expect(yTicks?.textContent).toBe('10152025303540');
      expect(xTicks?.textContent).toBe('01234');
      expect(yTicks?.firstElementChild?.getAttribute('style')).toMatch(
        /top:\s*100%/u,
      );
      expect(xTicks?.firstElementChild?.getAttribute('style')).toMatch(
        /left:\s*0%/u,
      );
      expect(yTicks?.firstElementChild?.getAttribute('class')).not.toBe(
        xTicks?.firstElementChild?.getAttribute('class'),
      );
      expect(
        pathsIn({
          container,
          selector: ':scope svg > path:not(:has(title))',
        }).filter((d) => !d?.endsWith('Z')),
      ).toEqual([
        [100, 83.33, 66.67, 50, 33.33, 16.67, 0]
          .map((y) => `M0,${String(y)}L100,${String(y)}`)
          .join(''),
      ]);
    });

    it('takes the domain, ticks and format from the axes', () => {
      const { container } = renderChart({
        xAxis: {
          domain: [0, 8],
          format: (x) => `#${String(x)}`,
          ticks: [0, 8],
        },
        yAxis: {
          domain: [0, 80],
          format: (y) => `${String(y)} ms`,
          ticks: [0, 40, 80, 120],
        },
      });
      const [yTicks, xTicks] = [
        ...container.querySelectorAll('[aria-hidden="true"]'),
      ];

      expect(
        [...(yTicks?.children ?? [])].map(({ textContent }) => textContent),
      ).toEqual(['0 ms', '40 ms', '80 ms']);
      expect(
        [...(xTicks?.children ?? [])].map(({ textContent }) => textContent),
      ).toEqual(['#0', '#8']);
      expect(
        titledPath({ container, name: 'Latency' })?.getAttribute('d'),
      ).toBe('M0,87.5L12.5,75M37.5,62.5L50,50');
    });

    it('formats a time axis as ISO dates by default', () => {
      const { container } = renderChart({
        series: [
          {
            ...LATENCY,
            points: [
              { x: new Date('2026-01-01T00:00:00Z'), y: 1 },
              { x: new Date('2026-01-05T00:00:00Z'), y: 2 },
            ],
          },
        ],
      });
      const xTicks = container.querySelectorAll('[aria-hidden="true"]')[1];

      expect(
        [...(xTicks?.children ?? [])].map(({ textContent }) => textContent),
      ).toEqual([
        '2026-01-01',
        '2026-01-02',
        '2026-01-03',
        '2026-01-04',
        '2026-01-05',
      ]);
    });
  });

  describe('data table', () => {
    it('renders a visually hidden table of every point when asked', () => {
      renderChart({
        hasDataTable: true,
        series: [
          {
            ...LATENCY,
            points: [
              { x: 0, y: 10 },
              { to: '/requests/1', x: 1, y: 20 },
              { x: 2, y: GAP },
            ],
          },
        ],
        xAxis: { label: 'Request' },
        yAxis: { label: 'Milliseconds' },
      });

      const table = screen.getByRole('table', { name: 'Request latency' });
      const rows = within(table)
        .getAllByRole('row')
        .map((row) => [...row.children].map(({ textContent }) => textContent));

      expect(rows).toEqual([
        ['Series', 'Request', 'Milliseconds'],
        ['Latency', '0', '10'],
        ['Latency', '1', '20'],
        ['Latency', '2', 'No value'],
      ]);
      expect(
        within(table).getByRole('link', { name: '20' }).getAttribute('href'),
      ).toBe('/requests/1');
      expect(within(table).getAllByRole('link')).toHaveLength(1);
      expect(table.getAttribute('class')).toBeTruthy();
    });

    it('heads the value columns x and y without axis labels', () => {
      renderChart({ hasDataTable: true });

      expect(
        screen
          .getAllByRole('columnheader')
          .map(({ textContent }) => textContent),
      ).toEqual(['Series', 'x', 'y']);
    });

    it('renders no table by default', () => {
      renderChart();

      expect(screen.queryByRole('table')).toBeNull();
    });
  });

  describe('empty series', () => {
    it.each([
      { name: 'no series', series: [], tickCounts: [0, 0] },
      {
        name: 'only null values',
        series: [{ ...LATENCY, points: [{ x: 0, y: GAP }] }],
        tickCounts: [0, 1],
      },
    ])(
      'renders a named chart with no paths and no value ticks for $name',
      ({ series, tickCounts }) => {
        const { container } = renderChart({ series });

        expect(
          screen.getByRole('img', { name: 'Request latency' }),
        ).toBeTruthy();
        expect(container.querySelectorAll(':scope path')).toHaveLength(0);
        expect(screen.queryByRole('list')).toBeNull();
        expect(
          [...container.querySelectorAll('[aria-hidden="true"]')].map(
            ({ childElementCount }) => childElementCount,
          ),
        ).toEqual(tickCounts);
      },
    );
  });

  describe('height', () => {
    it('sizes the plot from height and not from a measurement', () => {
      const { container: tall } = renderChart({ height: 400 });
      const { container: short } = renderChart();

      expect(tall.querySelector('svg')?.getAttribute('class')).toBe(
        short.querySelector('svg')?.getAttribute('class'),
      );
      expect(tall.querySelector('svg')?.getAttribute('style')).toContain(
        '400px',
      );
      expect(short.querySelector('svg')?.getAttribute('style')).toContain(
        '240px',
      );
    });
  });

  describe('server render', () => {
    const CHART = (
      <LineChart
        description='Milliseconds per request'
        hasDataTable
        markers={[{ label: 'Deploy', to: '/deploys/7', x: 2 }]}
        series={[
          {
            ...LATENCY,
            band: [
              { lower: 5, upper: 15, x: 0 },
              { lower: 35, upper: 45, x: 4 },
            ],
            points: [
              ...LATENCY.points,
              { label: 'Linked', to: '/requests/5', tone: 'error', x: 5, y: 9 },
            ],
          },
          THROUGHPUT,
        ]}
        title='Request latency'
        xAxis={{ label: 'Request' }}
        yAxis={{ label: 'Milliseconds' }}
      />
    );

    it('renders the same markup on the server and the client', () => {
      const tree = <MemoryRouter>{CHART}</MemoryRouter>;
      const { container } = render(tree);

      expect(normaliseMarkup(renderToString(tree))).toBe(
        normaliseMarkup(container.firstElementChild?.outerHTML ?? ''),
      );
    });

    it('hydrates the server markup without a warning', async () => {
      const tree = <MemoryRouter>{CHART}</MemoryRouter>;
      const container = document.createElement('div');
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onRecoverableError = vi.fn();

      container.innerHTML = renderToString(tree);
      document.body.append(container);

      const root = await act(async () =>
        hydrateRoot(container, tree, { onRecoverableError }),
      );

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();

      act(() => {
        root.unmount();
      });
      container.remove();
      errors.mockRestore();
    });
  });
});
