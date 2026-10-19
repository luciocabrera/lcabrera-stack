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
          findings: [
            {
              failed: 2,
              kind: 'flip',
              subject: { kind: 'skill', name: 'react-19' },
              taskKey: 't1',
              trials: 3,
            },
          ],
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
      'skill react-19: t1 failed 2 of 3 trials after passing every trial the run before',
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

  it('lists two scored subjects that regressed, each by name', async () => {
    renderWith({
      regressions: [
        {
          findings: ['react-19', 'store-pattern'].map((name) => ({
            kind: 'mean',
            mean: 3.2,
            subject: { kind: 'skill', name },
            threshold: 3.5,
          })),
          flakyLeftOut: [],
          latest: { runId: 'b' },
          previous: { runId: 'a' },
          suite: 'skill-quality',
        },
      ],
      suites: [],
    });

    const banner = await screen.findByRole('alert');

    expect(
      [...banner.querySelectorAll(':scope li')].map(
        ({ textContent }) => textContent,
      ),
    ).toEqual([
      'skill react-19: mean judge score 3.20, below 3.50, the baseline mean less 2 standard deviations',
      'skill store-pattern: mean judge score 3.20, below 3.50, the baseline mean less 2 standard deviations',
    ]);
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
