// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EvalsHeatmap } from './EvalsHeatmap.component';

const renderWith = (data: unknown) => {
  const Stub = createRoutesStub([
    { Component: EvalsHeatmap, loader: () => data, path: '/evals/heatmap' },
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
  });
});
