// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { Heatmap } from './Heatmap.component';

const ROWS = [
  { key: 'r1', label: 'Row 1' },
  { key: 'r2', label: 'Row 2' },
];

const COLUMNS = [
  { key: 'c1', label: 'Column 1' },
  { key: 'c2', label: 'Column 2' },
  { key: 'c3', label: 'Column 3' },
];

const renderHeatmap = () =>
  render(
    <MemoryRouter>
      <Heatmap
        cells={[{ column: 'c1', label: 'One', row: 'r1', tone: 'success' }]}
        columns={COLUMNS}
        legend={[{ label: 'Passing', tone: 'success' }]}
        rows={ROWS}
        title='Grid'
      />
    </MemoryRouter>,
  );

const plotHeight = () =>
  screen
    .getByRole('figure', { name: 'Grid' })
    .querySelector('svg[viewBox]')
    ?.getAttribute('height');

const table = () =>
  screen.getByText('Grid', { selector: 'caption' }).closest('table');

const openSettings = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Settings for Grid' }));

  return within(screen.getByTestId('side-panel'));
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

describe('Heatmap settings', () => {
  it('offers density, column labels, the legend and the data table', () => {
    renderHeatmap();

    const drawer = openSettings();

    expect(
      drawer
        .getAllByRole('group')
        .map((group) => group.firstChild?.textContent),
    ).toEqual(['Density', 'Column labels', 'Show']);
    expect(
      drawer
        .getAllByRole('switch')
        .map((toggle) => toggle.getAttribute('aria-checked')),
    ).toEqual(['true', 'false']);
    expect(drawer.getByRole('switch', { name: 'Legend' })).toBeDefined();
    expect(drawer.getByRole('switch', { name: 'Data table' })).toBeDefined();
  });

  it('draws its settings button above the figure', () => {
    renderHeatmap();

    const button = screen.getByRole('button', { name: 'Settings for Grid' });

    expect(
      button.compareDocumentPosition(
        screen.getByRole('figure', { name: 'Grid' }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('resizes the cells to the accepted density', () => {
    renderHeatmap();

    const before = plotHeight();
    const drawer = openSettings();

    fireEvent.click(drawer.getByRole('radio', { name: 'Spacious' }));

    expect(plotHeight()).toBe(before);

    fireEvent.click(drawer.getByRole('button', { name: 'Accept' }));

    expect([before, plotHeight()]).toEqual(['32', '56']);
    expect(screen.queryByTestId('side-panel')).toBeNull();
  });

  it('discards a staged change on Cancel', () => {
    renderHeatmap();

    const before = plotHeight();
    const drawer = openSettings();

    fireEvent.click(drawer.getByRole('radio', { name: 'Dense' }));
    fireEvent.click(drawer.getByRole('button', { name: 'Cancel' }));

    expect(plotHeight()).toBe(before);
    expect(
      openSettings().getByRole('radio', { name: 'Compact' }),
    ).toHaveProperty('checked', true);
  });

  it('shows the data table and hides the legend once accepted', () => {
    renderHeatmap();

    const drawer = openSettings();

    fireEvent.click(drawer.getByRole('switch', { name: 'Legend' }));
    fireEvent.click(drawer.getByRole('switch', { name: 'Data table' }));
    fireEvent.click(drawer.getByRole('button', { name: 'Accept' }));

    expect(screen.queryByText('Passing')).toBeNull();
    expect(screen.getByRole('table', { name: 'Grid' })).toBeDefined();
  });

  it('keeps every column label readable while it visually draws every 2nd', () => {
    renderHeatmap();

    const drawer = openSettings();

    fireEvent.click(drawer.getByRole('radio', { name: 'Every 2nd label' }));
    fireEvent.click(drawer.getByRole('button', { name: 'Accept' }));

    const labels = COLUMNS.map(
      ({ label }) => screen.getByTitle(label).firstElementChild?.tagName,
    );

    expect(labels).toEqual([undefined, 'SPAN', undefined]);
  });

  it('keeps a pinned panel open on Accept, and closes it once unpinned', () => {
    renderHeatmap();

    const drawer = openSettings();

    fireEvent.click(drawer.getByRole('button', { name: 'Pin drawer' }));
    fireEvent.click(
      within(screen.getByTestId('side-panel')).getByRole('radio', {
        name: 'Dense',
      }),
    );
    fireEvent.click(
      within(screen.getByTestId('side-panel')).getByRole('button', {
        name: 'Accept',
      }),
    );

    expect(screen.getByTestId('side-panel')).toBeDefined();

    const pinned = within(screen.getByTestId('side-panel'));

    fireEvent.click(pinned.getByRole('button', { name: 'Unpin drawer' }));
    fireEvent.click(
      within(screen.getByTestId('side-panel')).getByRole('button', {
        name: 'Accept',
      }),
    );

    expect(screen.queryByTestId('side-panel')).toBeNull();
  });

  it('styles the data table apart once it is shown, and leaves its cells bare while hidden', () => {
    render(
      <MemoryRouter>
        <Heatmap
          cells={[{ column: 'c1', label: 'One', row: 'r1', tone: 'success' }]}
          columns={COLUMNS}
          hasDataTable
          rows={ROWS}
          title='Grid'
        />
      </MemoryRouter>,
    );

    const hidden = table()?.className;
    const hiddenCell = table()?.querySelector('th')?.className;
    const drawer = openSettings();

    fireEvent.click(drawer.getByRole('switch', { name: 'Data table' }));
    fireEvent.click(drawer.getByRole('button', { name: 'Accept' }));

    expect(hiddenCell).toBe('');
    expect(table()?.className).not.toBe(hidden);
    expect(table()?.querySelector('th')?.className).not.toBe('');
  });

  it('draws no settings button when the feature is off', () => {
    render(
      <Heatmap
        cells={[]}
        columns={COLUMNS}
        features={{ settings: false }}
        rows={ROWS}
        title='Grid'
      />,
    );

    expect(screen.queryByRole('button')).toBeNull();
  });
});
