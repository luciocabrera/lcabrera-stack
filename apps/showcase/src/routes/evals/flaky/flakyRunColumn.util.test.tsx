// @vitest-environment jsdom

import { NavLink, StatusBadge } from '@lcabrera/ui';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { FlakyTaskRow } from './EvalsFlaky.types';

import { flakyRunColumn } from './flakyRunColumn.util';

const TASK: FlakyTaskRow = {
  cells: [
    { href: '/evals/runs/r1', isSplit: true, label: '2/3', runId: 'r1' },
    { href: '/evals/runs/r2', isSplit: false, label: '3/3', runId: 'r2' },
  ],
  disagreeing: 1,
  runs: 2,
  taskKey: 't1',
};

const renderRunCell = (runId: string) =>
  render(
    <MemoryRouter>
      {flakyRunColumn({
        href: `/evals/runs/${runId}`,
        label: '2026-10-01',
        runId,
      }).render(TASK)}
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
});

describe('flakyRunColumn', () => {
  it('heads an end-aligned column with the run’s date, keyed by its id', () => {
    expect(
      flakyRunColumn({
        href: '/evals/runs/r1',
        label: '2026-10-01',
        runId: 'r1',
      }),
    ).toMatchObject({ align: 'end', key: 'r1', label: '2026-10-01' });
  });

  it('links a split cell to its run with its tally in a warning badge', () => {
    render(<StatusBadge label='2/3' tone='warning' />);

    const badgeClass = screen.getByText('2/3').className;

    cleanup();
    renderRunCell('r1');

    const split = screen.getByRole('link', { name: '2/3' });

    expect(split.getAttribute('href')).toBe('/evals/runs/r1');
    expect(within(split).getByText('2/3').className).toBe(badgeClass);
  });

  it('links a steady cell to its run as a plain inline link', () => {
    render(
      <MemoryRouter>
        <NavLink to='/evals/runs/r2' variant='inline'>
          3/3
        </NavLink>
      </MemoryRouter>,
    );

    const plain = screen.getByRole('link', { name: '3/3' });
    const plainClasses = [plain.className, screen.getByText('3/3').className];

    cleanup();
    renderRunCell('r2');

    const steady = screen.getByRole('link', { name: '3/3' });

    expect(steady.getAttribute('href')).toBe('/evals/runs/r2');
    expect([
      steady.className,
      within(steady).getByText('3/3').className,
    ]).toEqual(plainClasses);
  });

  it('draws nothing for a run the task has no cell for', () => {
    renderRunCell('r9');

    expect(screen.queryByRole('link')).toBeNull();
  });
});
