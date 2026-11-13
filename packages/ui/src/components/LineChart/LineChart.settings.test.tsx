// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { LineChart } from './LineChart.component';

const SERIES = [
  {
    id: 'p50',
    label: 'p50',
    points: [
      { x: 0, y: 10 },
      { x: 100, y: 20 },
    ],
  },
  {
    id: 'p95',
    label: 'p95',
    points: [
      { x: 0, y: 30 },
      { x: 100, y: 90 },
    ],
  },
];

const renderChart = () =>
  render(
    <LineChart
      markers={[{ label: 'Deploy', x: 50 }]}
      series={SERIES}
      title='Latency'
    />,
  );

const figure = () => screen.getByRole('figure', { name: 'Latency' });

const plotStyle = () =>
  figure().querySelector('svg')?.parentElement?.getAttribute('style');

const yTicks = () =>
  figure().querySelector('[aria-hidden="true"]')?.children.length ?? 0;

const dotTitles = () =>
  [...figure().querySelectorAll(':scope svg > path > title')]
    .map(({ textContent }) => textContent)
    .filter((title) => title?.includes(', '));

const table = () =>
  screen.getByText('Latency', { selector: 'caption' }).closest('table');

const openSettings = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Settings for Latency' }));

  return within(screen.getByTestId('side-panel'));
};

const accept = (drawer: ReturnType<typeof openSettings>) => {
  fireEvent.click(drawer.getByRole('button', { name: 'Accept' }));
};

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal(
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '');
  };
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
});

describe('LineChart settings', () => {
  it('offers density, points, ticks, the legend, the data table and marker labels', () => {
    renderChart();

    const drawer = openSettings();

    expect(
      drawer
        .getAllByRole('group')
        .map((group) => group.firstChild?.textContent),
    ).toEqual(['Density', 'Points', 'Axis ticks', 'Show']);
    expect(
      ['Legend', 'Data table', 'Marker labels'].map((name) =>
        drawer.getByRole('switch', { name }).getAttribute('aria-checked'),
      ),
    ).toEqual(['true', 'false', 'true']);
  });

  it('scales the plot height to the accepted density', () => {
    renderChart();

    const before = plotStyle();
    const drawer = openSettings();

    fireEvent.click(drawer.getByRole('radio', { name: 'Dense' }));
    accept(drawer);

    expect(before).toContain('240px');
    expect(plotStyle()).toContain('150px');
  });

  it('draws more y ticks for the Many tick count', () => {
    renderChart();

    const before = yTicks();
    const drawer = openSettings();

    fireEvent.click(drawer.getByRole('radio', { name: 'Many' }));
    accept(drawer);

    expect(yTicks()).toBeGreaterThan(before);
  });

  it('hides the legend and the marker labels and shows the data table once accepted', () => {
    renderChart();

    const drawer = openSettings();

    fireEvent.click(drawer.getByRole('switch', { name: 'Legend' }));
    fireEvent.click(drawer.getByRole('switch', { name: 'Marker labels' }));
    fireEvent.click(drawer.getByRole('switch', { name: 'Data table' }));
    accept(drawer);

    const drawn = within(figure());

    expect(
      drawn
        .queryAllByText('Deploy')
        .map(({ tagName }) => tagName.toLowerCase()),
    ).toEqual(['title']);
    expect(
      drawn.queryAllByText('p95').filter((label) => label.closest('li')),
    ).toEqual([]);
    expect(drawn.getByRole('table', { name: 'Latency' })).toBeDefined();
  });

  it('styles the data table apart once it is shown, and leaves its cells bare while hidden', () => {
    render(<LineChart hasDataTable series={SERIES} title='Latency' />);

    const hidden = table()?.className;
    const hiddenCell = table()?.querySelector('th')?.className;
    const drawer = openSettings();

    fireEvent.click(drawer.getByRole('switch', { name: 'Data table' }));
    accept(drawer);

    expect(hiddenCell).toBe('');
    expect(table()?.className).not.toBe(hidden);
    expect(table()?.querySelector('th')?.className).not.toBe('');
  });

  it('drops the unlinked dots once Linked points only is accepted', () => {
    renderChart();

    const before = dotTitles();
    const drawer = openSettings();

    fireEvent.click(drawer.getByRole('radio', { name: 'Linked points only' }));
    accept(drawer);

    expect([before.length, dotTitles()]).toEqual([4, []]);
  });
});
