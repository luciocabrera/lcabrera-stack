// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EvalsOverview } from './EvalsOverview.component';

const renderWith = (data: unknown) => {
  const Stub = createRoutesStub([
    { Component: EvalsOverview, loader: () => data, path: '/evals' },
  ]);

  return render(<Stub initialEntries={['/evals']} />);
};

afterEach(() => {
  cleanup();
});

describe('EvalsOverview', () => {
  it('names each finding of a regression and the flaky tasks left out of it', async () => {
    renderWith({
      regressions: [
        {
          findings: [{ failed: 2, kind: 'flip', taskKey: 't1', trials: 3 }],
          flakyLeftOut: ['t2', 't3'],
          latest: { runId: 'b' },
          previous: { runId: 'a' },
          suite: 'skills',
        },
      ],
      suites: [],
    });

    const banner = await screen.findByRole('alert');

    expect(banner.textContent).toContain('skills regressed on main');
    expect(banner.textContent).toContain(
      't1 failed 2 of 3 trials after passing every trial the run before',
    );
    expect(banner.textContent).toContain(
      '2 flaky tasks were left out of the rule',
    );
    expect(
      screen
        .getByRole('link', { name: 'see the flaky tasks' })
        .getAttribute('href'),
    ).toBe('/evals/flaky');
  });

  it('links every view', async () => {
    renderWith({ regressions: [], suites: [] });

    const views = await screen.findByRole('navigation', { name: 'Eval views' });

    expect(
      [...views.querySelectorAll('a')].map((link) => link.getAttribute('href')),
    ).toEqual([
      '/evals/compare',
      '/evals/heatmap',
      '/evals/cost',
      '/evals/flaky',
      '/evals/confusion',
      '/evals/quality',
      '/evals/health',
    ]);
  });
});
