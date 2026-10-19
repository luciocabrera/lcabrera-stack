// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EvalsFlaky } from './EvalsFlaky.component';

const renderWith = (data: unknown) => {
  const Stub = createRoutesStub([
    { Component: EvalsFlaky, loader: () => data, path: '/evals/flaky' },
  ]);

  return render(<Stub initialEntries={['/evals/flaky']} />);
};

afterEach(() => {
  cleanup();
});

describe('EvalsFlaky', () => {
  it('lists each flaky task with its split per run', async () => {
    renderWith({
      suites: [
        {
          basis: {
            kind: 'pair',
            latest: {
              href: '/evals/runs/r1',
              label: '2026-10-01 02:00 on main',
            },
            previous: {
              href: '/evals/runs/r0',
              label: '2026-09-30 02:00 on main',
            },
          },
          runs: [{ href: '/evals/runs/r1', label: '2026-10-01', runId: 'r1' }],
          suite: 'skills',
          tasks: [
            {
              cells: [
                {
                  href: '/evals/runs/r1',
                  isSplit: true,
                  label: '2/3',
                  runId: 'r1',
                },
              ],
              disagreeing: 4,
              runs: 10,
              taskKey: 'skills/react-19/trigger-1',
            },
          ],
        },
      ],
    });

    expect(
      await screen.findByRole('table', {
        name: "skills: 1 flaky tasks left out, each over the suite's last 1 runs, oldest first",
      }),
    ).toBeDefined();
    expect(screen.getByText('skills/react-19/trigger-1')).toBeDefined();
    expect(screen.getByText('4 of 10')).toBeDefined();
    expect(screen.getByRole('link', { name: '2/3' }).getAttribute('href')).toBe(
      '/evals/runs/r1',
    );
    expect(
      screen
        .getByRole('link', { name: '2026-09-30 02:00 on main' })
        .getAttribute('href'),
    ).toBe('/evals/runs/r0');
  });

  it('says when a suite has no flaky task', async () => {
    renderWith({
      suites: [
        { basis: { kind: 'all-runs' }, runs: [], suite: 'skills', tasks: [] },
      ],
    });

    expect(await screen.findByText('No flaky task is left out.')).toBeDefined();
    expect(screen.getByText(/Fewer than two main runs/u)).toBeDefined();
  });
});
