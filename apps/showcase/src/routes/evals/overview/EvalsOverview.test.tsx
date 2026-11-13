// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { expectHydratesWithoutMismatch } from '../utils/serverMarkup.fixtures';
import { EvalsOverview } from './EvalsOverview.component';

const LATEST = {
  branch: 'main',
  costUsd: undefined,
  durationMs: 1000,
  gitSha: 'a'.repeat(40),
  k: 1,
  n: 2,
  rate: 0.5,
  runId: 'b',
  startedAt: '2026-10-01T02:00:00.000Z',
  suite: 'skills',
} as RunFigures;

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

    expect(banner.textContent).toContain(
      'skills regressed on main in the latest run against the run before. Compare them.',
    );
    expect(
      within(banner)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['the latest run', '/evals/runs/b'],
      ['the run before', '/evals/runs/a'],
      ['Compare them', '/evals/compare?a=a&b=b'],
      ['see the flaky tasks', '/evals/flaky'],
    ]);
    expect(banner.textContent).toContain(
      'skill react-19: t1 failed 2 of 3 trials after passing every trial the run before',
    );
    expect(banner.textContent).toContain(
      '2 flaky tasks were left out of the rule; see the flaky tasks.',
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
    expect(banner.textContent).not.toContain('flaky');
  });

  it('says one flaky task was left out, in the singular', async () => {
    renderWith({
      regressions: [
        {
          findings: [],
          flakyLeftOut: ['t2'],
          latest: { runId: 'b' },
          previous: { runId: 'a' },
          suite: 'skills',
        },
      ],
      suites: [],
    });

    const banner = await screen.findByRole('alert');

    expect(banner.textContent).toContain(
      '1 flaky task was left out of the rule; see the flaky tasks.',
    );
  });

  it('links every view', async () => {
    renderWith({ regressions: [], suites: [] });

    const views = await screen.findByRole('navigation', { name: 'Eval views' });

    expect(
      [...views.querySelectorAll('a')].map((link) => [
        link.textContent,
        link.getAttribute('href'),
      ]),
    ).toEqual([
      ['Compare runs', '/evals/compare'],
      ['Heatmap', '/evals/heatmap'],
      ['Cost and latency', '/evals/cost'],
      ['Flaky tasks', '/evals/flaky'],
      ['Trigger confusion', '/evals/confusion'],
      ['Quality dimensions', '/evals/quality'],
      ['Run health', '/evals/health'],
      ['False-positive panel', '/evals/adjudications'],
    ]);
  });

  it('has no breadcrumb trail above its level-1 title', async () => {
    renderWith({ regressions: [], suites: [] });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Evals' }),
    ).toBeDefined();
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull();
    expect(screen.getByText('No eval runs are stored yet.')).toBeDefined();
  });

  it('draws one card per suite with its facts, its flaky link and its sparkline', async () => {
    renderWith({
      regressions: [],
      suites: [
        {
          flakyLeftOut: ['t2'],
          latest: LATEST,
          points: [{ label: 'Run b', to: '/evals/runs/b', value: 0.5 }],
          suite: 'skills',
        },
        {
          latest: { ...LATEST, runId: 'c', suite: 'rules-consistency' },
          points: [],
          suite: 'rules-consistency',
        },
      ],
    });

    const heading = await screen.findByRole('heading', {
      level: 2,
      name: 'skills',
    });

    expect(
      within(heading)
        .getByRole('link', { name: 'skills' })
        .getAttribute('href'),
    ).toBe('/evals/runs/b');
    expect(
      screen.getAllByRole('definition').map(({ textContent }) => textContent),
    ).toEqual([
      '50% (1/2)',
      'too few trials for an interval',
      'not reported',
      '1s',
      '1 tasks',
      '2026-10-01 02:00 on main at aaaaaaaa',
      '50% (1/2)',
      'too few trials for an interval',
      'not reported',
      '1s',
      'no main pair to judge',
      '2026-10-01 02:00 on main at aaaaaaaa',
    ]);
    expect(
      screen.getByRole('link', { name: '1 tasks' }).getAttribute('href'),
    ).toBe('/evals/flaky');
    expect(
      screen.queryByRole('link', { name: 'no main pair to judge' }),
    ).toBeNull();
    expect(
      within(
        screen.getByRole('group', {
          name: 'skills pass rate over its last 1 runs',
        }),
      )
        .getByRole('link', { name: 'Run b' })
        .getAttribute('href'),
    ).toBe('/evals/runs/b');
    expect(
      screen.getByRole('group', {
        name: 'rules-consistency pass rate over its last 0 runs',
      }),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: /^Settings for / })).toBeNull();
  });

  it('hydrates the server markup of a populated overview without a mismatch', async () => {
    await expectHydratesWithoutMismatch({
      path: '/evals',
      routes: [
        {
          Component: EvalsOverview,
          loader: () => ({
            regressions: [],
            suites: [
              {
                flakyLeftOut: [],
                latest: LATEST,
                points: [{ label: 'Run b', to: '/evals/runs/b', value: 0.5 }],
                suite: 'skills',
              },
            ],
          }),
          path: '/evals',
        },
      ],
    });
  });
});
