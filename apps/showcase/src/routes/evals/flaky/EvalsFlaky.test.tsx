// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { breadcrumbTrail, evalsTrail } from '../utils/pageHeader.fixtures';
import { tableCells, tableHeaders } from '../utils/staticTable.fixtures';
import { EvalsFlaky } from './EvalsFlaky.component';
import { EVALS_FLAKY_HANDLE } from './EvalsFlaky.constants';

const renderWith = (data: unknown) => {
  const Stub = createRoutesStub([
    {
      Component: EvalsFlaky,
      handle: EVALS_FLAKY_HANDLE,
      loader: () => data,
      path: '/evals/flaky',
    },
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
          runs: [
            { href: '/evals/runs/r0', label: '2026-09-30', runId: 'r0' },
            { href: '/evals/runs/r1', label: '2026-10-01', runId: 'r1' },
          ],
          suite: 'skills',
          tasks: [
            {
              cells: [
                {
                  href: '/evals/runs/r0',
                  isSplit: false,
                  label: '3/3',
                  runId: 'r0',
                },
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

    const table = await screen.findByRole('table', {
      name: "skills: 1 flaky tasks left out, each over the suite's last 2 runs, oldest first",
    });
    const [task] = tableCells(table);

    expect(tableHeaders(table)).toEqual([
      'Task',
      'Split runs',
      '2026-09-30',
      '2026-10-01',
    ]);
    expect(task?.map(({ column }) => column)).toEqual([
      'taskKey',
      'disagreeing',
      'r0',
      'r1',
    ]);
    expect(task?.map(({ text }) => text)).toEqual([
      'skills/react-19/trigger-1',
      '4 of 10',
      '3/3',
      '2/3',
    ]);
    expect(task?.[1]?.className).toBe(task?.[2]?.className);
    expect(task?.[1]?.className).not.toBe(task?.[0]?.className);

    const steady = within(table).getByRole('link', { name: '3/3' });
    const split = within(table).getByRole('link', { name: '2/3' });

    expect(steady.getAttribute('href')).toBe('/evals/runs/r0');
    expect(split.getAttribute('href')).toBe('/evals/runs/r1');
    expect(split.className).not.toBe(steady.className);
    expect(
      screen.getByRole('heading', { level: 2, name: 'skills' }),
    ).toBeDefined();
    expect(
      screen.getByRole('link', { name: '2026-09-30 02:00 on main' })
        .parentElement?.textContent,
    ).toBe(
      'Left out when judging 2026-10-01 02:00 on main against 2026-09-30 02:00 on main. Neither run counts toward flakiness.',
    );
    expect(
      screen.getByRole('link', { name: 'the overview' }).getAttribute('href'),
    ).toBe('/evals');
    expect(
      screen.getByRole('link', { name: 'the overview' }).parentElement
        ?.textContent,
    ).toBe(
      "Per suite, the tasks the regression rule behind the banner on the overview leaves out when it judges main's latest run against the one before. Such a task had trials that disagreed in more than 20% of its last 10 runs, not counting those two runs, so a drop in the run being judged cannot make its own task flaky. A suite with fewer than two main runs has no pair to judge, and its list counts every run. Each cell is the task's passing trials out of its scored ones in that run.",
    );
  });

  it('says when a suite has no flaky task', async () => {
    renderWith({
      suites: [
        { basis: { kind: 'all-runs' }, runs: [], suite: 'skills', tasks: [] },
      ],
    });

    expect(await screen.findByText('No flaky task is left out.')).toBeDefined();
    expect(screen.getByText(/Fewer than two main runs/u)).toBeDefined();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('says when no run is stored', async () => {
    renderWith({ suites: [] });

    expect(
      await screen.findByText('No eval runs are stored yet.'),
    ).toBeDefined();

    expect(breadcrumbTrail()).toEqual(evalsTrail('flaky'));
  });
});
