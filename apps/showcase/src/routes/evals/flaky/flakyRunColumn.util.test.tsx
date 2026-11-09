// @vitest-environment jsdom

import { NavLink } from '@lcabrera/ui';
import { cleanup, render, screen } from '@testing-library/react';
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

  it('links each cell to its run, and styles a split cell apart from a steady one', () => {
    renderRunCell('r1');

    const split = screen.getByRole('link', { name: '2/3' });
    const splitClass = split.className;

    expect(split.getAttribute('href')).toBe('/evals/runs/r1');

    cleanup();
    renderRunCell('r2');

    const steady = screen.getByRole('link', { name: '3/3' });

    expect(steady.getAttribute('href')).toBe('/evals/runs/r2');
    expect(splitClass).not.toBe(steady.className);

    const steadyClass = steady.className;

    cleanup();
    render(
      <MemoryRouter>
        <NavLink to='/evals/runs/r2' variant='inline'>
          3/3
        </NavLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '3/3' }).className).toBe(
      steadyClass,
    );
  });

  it('draws nothing for a run the task has no cell for', () => {
    renderRunCell('r9');

    expect(screen.queryByRole('link')).toBeNull();
  });
});
