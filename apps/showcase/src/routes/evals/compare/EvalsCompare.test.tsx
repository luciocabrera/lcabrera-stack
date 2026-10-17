// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { EvalsCompare } from './EvalsCompare.component';

type RunArgs = {
  readonly rate: number;
  readonly runId: string;
};

const run = ({ rate, runId }: RunArgs) =>
  ({
    branch: 'main',
    k: Math.round(rate * 4),
    n: 4,
    rate,
    runId,
    startedAt: '2026-10-01T02:00:00.000Z',
    suite: 'skills',
  }) as RunFigures;

const COMPARISON = {
  a: run({ rate: 1, runId: 'run-a' }),
  b: run({ rate: 0.5, runId: 'run-b' }),
  changes: { changed: 'skill react-19 content', kind: 'single' as const },
  flips: [
    {
      a: '3/3',
      b: '1/3',
      change: 'regressed' as const,
      id: 'skills/t1',
      subjectKind: 'skill',
      subjectName: 'react-19',
      taskKey: 't1',
    },
  ],
  tasks: 7,
  totals: [{ a: '100%', b: '50%', change: '-50 pts', metric: 'Pass rate' }],
};

const renderWith = (data: unknown) => {
  const Stub = createRoutesStub([
    { Component: EvalsCompare, loader: () => data, path: '/evals/compare' },
  ]);

  return render(<Stub initialEntries={['/evals/compare']} />);
};

afterEach(() => {
  cleanup();
});

describe('EvalsCompare', () => {
  it('shows the flipped tasks, the totals and the one changed input', async () => {
    renderWith({ choices: [], comparison: COMPARISON });

    const flips = await screen.findByRole('table', {
      name: '1 of 7 tasks changed verdict',
    });

    expect(
      within(flips)
        .getByRole('link', { name: 'react-19' })
        .getAttribute('href'),
    ).toBe('/evals/subjects/skill/react-19');
    expect(within(flips).getByText('regressed')).toBeDefined();
    expect(
      screen.getByRole('table', { name: 'Run A against run B' }),
    ).toBeDefined();
    expect(
      screen.getByText('One cause: skill react-19 content.'),
    ).toBeDefined();
    expect(
      screen
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'))
        .filter((href) => href?.startsWith('/evals/runs/')),
    ).toEqual(['/evals/runs/run-a', '/evals/runs/run-b']);
  });

  it('prefills the older run as A and the newer as B, so an unchanged submit reads forward in time', async () => {
    renderWith({
      choices: [
        run({ rate: 0.5, runId: 'run-newest' }),
        run({ rate: 1, runId: 'run-before' }),
      ],
      comparison: undefined,
    });

    const [first, second] = await screen.findAllByRole('combobox');

    expect([first?.getAttribute('name'), second?.getAttribute('name')]).toEqual(
      ['a', 'b'],
    );
    expect([
      (first as HTMLSelectElement | undefined)?.value,
      (second as HTMLSelectElement | undefined)?.value,
    ]).toEqual(['run-before', 'run-newest']);
    expect(screen.getByRole('textbox', { name: 'Branch' })).toBeDefined();
  });
});
