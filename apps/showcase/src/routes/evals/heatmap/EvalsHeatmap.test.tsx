// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { breadcrumbTrail, evalsTrail } from '../utils/pageHeader.fixtures';
import { expectHydratesWithoutMismatch } from '../utils/serverMarkup.fixtures';
import { EvalsHeatmap } from './EvalsHeatmap.component';
import { EVALS_HEATMAP_HANDLE } from './EvalsHeatmap.constants';

const GRID = {
  cells: [
    {
      column: 'r1',
      label: 'react-19, 2026-10-01: 60% (3/5), flaky; open trial 1',
      pattern: 'hatch',
      row: 'skill/react-19',
      to: '/evals/runs/r1?trial=1',
      tone: 'warning',
    },
  ],
  columns: [{ key: 'r1', label: 'Run r1', to: '/evals/runs/r1' }],
  rows: [
    {
      key: 'skill/react-19',
      label: 'react-19',
      to: '/evals/subjects/skill/react-19',
    },
  ],
  suite: 'skills',
  title: 'skills: 1 subjects over 1 runs',
};

const renderWith = (data: unknown) => {
  const Stub = createRoutesStub([
    {
      Component: EvalsHeatmap,
      handle: EVALS_HEATMAP_HANDLE,
      loader: () => data,
      path: '/evals/heatmap',
    },
  ]);

  return render(<Stub initialEntries={['/evals/heatmap']} />);
};

afterEach(() => {
  cleanup();
});

describe('EvalsHeatmap', () => {
  it('draws a figure per suite named by its shape, with linked axes and cells', async () => {
    renderWith({ flaky: [], grids: [GRID] });

    const tab = await screen.findByRole('tab', { name: 'skills' });

    expect(tab.getAttribute('aria-selected')).toBe('true');

    const figure = screen.getByRole('figure', {
      name: 'skills: 1 subjects over 1 runs',
    });

    expect(
      within(figure)
        .getAllByRole('link')
        .map((link) => [
          link.textContent || link.getAttribute('aria-label'),
          link.getAttribute('href'),
        ]),
    ).toEqual([
      ['Run r1', '/evals/runs/r1'],
      ['react-19', '/evals/subjects/skill/react-19'],
      [
        'react-19, 2026-10-01: 60% (3/5), flaky; open trial 1',
        '/evals/runs/r1?trial=1',
      ],
    ]);
    expect(within(figure).getByText('Holds a flaky task')).toBeDefined();
  });

  it('puts each suite under its own tab', async () => {
    renderWith({
      flaky: [],
      grids: [GRID, { ...GRID, suite: 'skill-quality', title: 'other' }],
    });

    fireEvent.click(await screen.findByRole('tab', { name: 'skill-quality' }));

    expect(screen.getByRole('figure', { name: 'other' })).toBeDefined();
    expect(screen.queryByRole('figure', { name: GRID.title })).toBeNull();
  });

  it('gives each heatmap its own settings button', async () => {
    renderWith({ flaky: [], grids: [GRID] });

    expect(
      await screen.findByRole('button', {
        name: `Settings for ${GRID.title}`,
      }),
    ).toBeDefined();
  });

  it('says when no run is stored', async () => {
    renderWith({ flaky: [], grids: [] });

    expect(
      await screen.findByText('No eval runs are stored yet.'),
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Heatmap' }),
    ).toBeDefined();
    expect(breadcrumbTrail()).toEqual(evalsTrail('heatmap'));
  });

  it('hydrates the server markup without a mismatch', async () => {
    await expectHydratesWithoutMismatch({
      path: '/evals/heatmap',
      routes: [
        {
          Component: EvalsHeatmap,
          handle: EVALS_HEATMAP_HANDLE,
          loader: () => ({ flaky: [], grids: [GRID] }),
          path: '/evals/heatmap',
        },
      ],
    });
  });
});
