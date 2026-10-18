// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EvalsHealth } from './EvalsHealth.component';

const renderWith = (data: unknown) => {
  const Stub = createRoutesStub([
    { Component: EvalsHealth, loader: () => data, path: '/evals/health' },
  ]);

  return render(<Stub initialEntries={['/evals/health']} />);
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

afterEach(() => {
  cleanup();
});

describe('EvalsHealth', () => {
  it('counts each error class and lists the runs it hit', async () => {
    renderWith({
      suites: [
        {
          classes: [
            {
              errorClass: 'rate_limit',
              id: 'error/rate_limit',
              isRateLimit: true,
              outcome: 'error',
              runs: 1,
              trials: 2,
            },
          ],
          points: [
            {
              href: RUN.href,
              key: 'r1',
              label: 'r1: 2 errors, 1 timeouts',
              tone: 'error',
              value: 3,
            },
          ],
          runs: 1,
          suite: 'skills',
          totals: { errors: 2, rateLimits: 2, timeouts: 1, trials: 9 },
          troubled: [RUN],
        },
      ],
    });

    const classes = await screen.findByRole('table', {
      name: 'skills: errors and timeouts by error class',
    });

    expect(
      [...classes.querySelectorAll(':scope tbody td')].map(
        ({ textContent }) => textContent,
      ),
    ).toEqual(['error', 'rate_limit', '2', '1']);
    expect(
      screen.getByRole('link', { name: RUN.label }).getAttribute('href'),
    ).toBe(RUN.href);
    expect(
      [
        ...screen
          .getByRole('table', {
            name: 'skills: the runs with an error or a timeout, newest first',
          })
          .querySelectorAll(':scope tbody td'),
      ].map(({ textContent }) => textContent),
    ).toEqual([RUN.label, '9', '2', '1', '2']);
  });

  it('says when a suite had no error or timeout', async () => {
    renderWith({
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
      await screen.findByText('No error or timeout in its last 4 runs.'),
    ).toBeDefined();
  });
});
