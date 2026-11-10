// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { breadcrumbTrail, evalsTrail } from '../utils/pageHeader.fixtures';
import { expectHydratesWithoutMismatch } from '../utils/serverMarkup.fixtures';
import { EvalsHeatmap } from './EvalsHeatmap.component';
import { EVALS_HEATMAP_HANDLE } from './EvalsHeatmap.constants';

const GRID = {
  runs: [{ href: '/evals/runs/r1', label: 'Run r1', runId: 'r1' }],
  subjects: [
    {
      cells: [
        {
          href: '/evals/runs/r1?trial=1',
          isFlaky: true,
          key: 'skill/react-19/r1',
          label: 'react-19, 2026-10-01: 60% (3/5), flaky; open trial 1',
          tone: 'mid',
        },
      ],
      href: '/evals/subjects/skill/react-19',
      key: 'skill/react-19',
      label: 'react-19',
    },
  ],
  suite: 'skills',
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
  it('draws a grid per suite', async () => {
    renderWith({
      flaky: [],
      grids: [
        {
          runs: [{ href: '/evals/runs/r1', label: 'Run r1', runId: 'r1' }],
          subjects: [],
          suite: 'skills',
        },
      ],
    });

    expect(
      await screen.findByRole('heading', { level: 2, name: 'skills' }),
    ).toBeDefined();
    expect(
      screen.getByRole('figure', { name: 'skills: 0 subjects over 1 runs' }),
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
