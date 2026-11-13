// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { breadcrumbTrail, evalsTrail } from '../utils/pageHeader.fixtures';
import { EvalsHealth } from './EvalsHealth.component';
import { EVALS_HEALTH_HANDLE } from './EvalsHealth.constants';

const renderWith = async (data: unknown) => {
  const Stub = createRoutesStub([
    {
      Component: EvalsHealth,
      handle: EVALS_HEALTH_HANDLE,
      loader: () => data,
      path: '/evals/health',
    },
  ]);

  render(<Stub initialEntries={['/evals/health']} />);
  await screen.findByRole('heading', { level: 1, name: 'Run health' });
};

const RUN = {
  errors: 2,
  href: '/evals/runs/r1',
  label: '2026-10-01 02:00 on main',
  rateLimits: 2,
  runId: 'r1',
  timeouts: 1,
  trials: 9,
};

const TROUBLED_SUITE = {
  classes: [
    {
      errorClass: 'rate_limit',
      id: 'error/rate_limit',
      isRateLimit: true,
      outcome: 'error',
      runs: 1,
      trials: 2,
    },
    {
      errorClass: 'execution',
      id: 'error/execution',
      isRateLimit: false,
      outcome: 'error',
      runs: 1,
      trials: 1,
    },
  ],
  points: [
    {
      label: 'r1: 2 errors, 1 timeouts',
      to: RUN.href,
      tone: 'error',
      value: 3,
    },
  ],
  runs: 1,
  suite: 'skills',
  totals: { errors: 2, rateLimits: 2, timeouts: 1, trials: 9 },
  troubled: [RUN],
};

const cellTexts = (table: HTMLElement) =>
  within(table)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);

afterEach(() => {
  cleanup();
});

describe('EvalsHealth', () => {
  it('says no run is stored yet, under a trail back to the overview', async () => {
    await renderWith({ suites: [] });

    expect(screen.getByText('No eval runs are stored yet.')).toBeDefined();
    expect(breadcrumbTrail()).toEqual(evalsTrail('health'));
  });

  it('lists the facts of each suite under its level-2 heading', async () => {
    await renderWith({ suites: [TROUBLED_SUITE] });

    expect(
      screen.getByRole('heading', { level: 2, name: 'skills' }),
    ).toBeDefined();
    expect(
      screen.getAllByRole('term').map(({ textContent }) => textContent),
    ).toEqual(['Runs', 'Trials', 'Errors', 'Timeouts', 'Rate limits']);
    expect(
      screen.getAllByRole('definition').map(({ textContent }) => textContent),
    ).toEqual(['1', '9', '2', '1', '2']);
  });

  it('links each sparkline point to its run', async () => {
    await renderWith({ suites: [TROUBLED_SUITE] });

    const chart = screen.getByRole('group', {
      name: 'skills errors and timeouts per run over its last 1 runs',
    });

    expect(
      within(chart)
        .getByRole('link', { name: 'r1: 2 errors, 1 timeouts' })
        .getAttribute('href'),
    ).toBe(RUN.href);
    expect(screen.queryByRole('button', { name: /^Settings for / })).toBeNull();
  });

  it('counts each error class and badges only the rate limit', async () => {
    await renderWith({ suites: [TROUBLED_SUITE] });

    const classes = screen.getByRole('table', {
      name: 'skills: errors and timeouts by error class',
    });

    expect(
      within(classes)
        .getAllByRole('columnheader')
        .map(({ textContent }) => textContent),
    ).toEqual(['Outcome', 'Error class', 'Trials', 'Runs']);
    expect(cellTexts(classes)).toEqual([
      'error',
      'rate_limit',
      '2',
      '1',
      'error',
      'execution',
      '1',
      '1',
    ]);
    expect(
      within(classes).getByText('rate_limit').closest('td')?.children,
    ).toHaveLength(1);
    expect(within(classes).getByText('execution').tagName).toBe('TD');
  });

  it('lists the troubled runs, each linking its run', async () => {
    await renderWith({ suites: [TROUBLED_SUITE] });

    const runs = screen.getByRole('table', {
      name: 'skills: the runs with an error or a timeout, newest first',
    });

    expect(
      within(runs)
        .getAllByRole('columnheader')
        .map(({ textContent }) => textContent),
    ).toEqual(['Run', 'Trials', 'Errors', 'Timeouts', 'Rate limits']);
    expect(cellTexts(runs)).toEqual([RUN.label, '9', '2', '1', '2']);
    expect(
      within(runs).getByRole('link', { name: RUN.label }).getAttribute('href'),
    ).toBe(RUN.href);
  });

  it('says when a suite had no error or timeout, and draws no table', async () => {
    await renderWith({
      suites: [
        {
          classes: [],
          points: [],
          runs: 4,
          suite: 'skills',
          totals: { errors: 0, rateLimits: 0, timeouts: 0, trials: 12 },
          troubled: [],
        },
      ],
    });

    expect(
      screen.getByText('No error or timeout in its last 4 runs.'),
    ).toBeDefined();
    expect(screen.queryByRole('table')).toBeNull();
  });
});
